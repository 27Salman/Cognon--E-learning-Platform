const PDFDocument = require('pdfkit');
const path = require('path');
const Order = require('../models/Order');

const FONT_REGULAR = path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf');
const FONT_BOLD    = path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf');

const INR = (n) => {
    const num = Number(n || 0);
    return '\u20B9' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const invoiceService = {

    async getOrderForInvoice(orderId, userId) {
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('user', 'name email phone')
            .populate('courses.course', 'title')
            .populate('courses.tutor', 'name');

        if (!order) throw new Error('Order not found');
        if (order.paymentStatus !== 'completed') {
            throw new Error('Invoice is only available for completed orders');
        }
        return order;
    },

    generateInvoicePDF(order, res) {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
        doc.pipe(res);

        // ── Palette ───────────────────────────────────────────────────────
        const PURPLE       = '#6d28d9';
        const PURPLE_MID   = '#7c3aed';
        const PURPLE_LIGHT = '#ede9fe';
        const WHITE        = '#ffffff';
        const DARK         = '#111827';
        const GRAY         = '#6b7280';
        const LIGHT_GRAY   = '#f9fafb';
        const BORDER       = '#e5e7eb';
        const GREEN        = '#059669';
        const GREEN_LIGHT  = '#d1fae5';

        const PW = 595.28;
        const PH = 841.89;
        const ML = 48;   // margin left
        const MR = 48;   // margin right
        const CW = PW - ML - MR;  // content width = 499.28

        // ════════════════════════════════════════════════════════════════
        // HEADER — full-width purple band
        // ════════════════════════════════════════════════════════════════
        doc.rect(0, 0, PW, 120).fill(PURPLE);

        // Cognon branding — left
        doc.font(FONT_BOLD).fontSize(30).fillColor(WHITE).text('Cognon', ML, 28);
        doc.font(FONT_REGULAR).fontSize(9).fillColor('#c4b5fd')
            .text('Online Learning Platform', ML, 64)
            .text('support@cognon.com', ML, 78);

        // INVOICE label — right
        doc.font(FONT_BOLD).fontSize(36).fillColor(WHITE)
            .text('INVOICE', 0, 38, { align: 'right', width: PW - MR });

        // Thin accent line below header
        doc.rect(0, 120, PW, 3).fill('#4c1d95');

        // ════════════════════════════════════════════════════════════════
        // INFO BLOCK — Billed To (left) | Invoice Meta (right)
        // ════════════════════════════════════════════════════════════════
        const infoY = 142;

        // Left column: Billed To
        doc.font(FONT_BOLD).fontSize(7.5).fillColor(PURPLE)
            .text('BILLED TO', ML, infoY);
        doc.font(FONT_BOLD).fontSize(14).fillColor(DARK)
            .text(order.user?.name || 'Student', ML, infoY + 14);
        doc.font(FONT_REGULAR).fontSize(9).fillColor(GRAY)
            .text(order.user?.email || '', ML, infoY + 32);
        if (order.user?.phone) {
            doc.font(FONT_REGULAR).fontSize(9).fillColor(GRAY)
                .text(order.user.phone, ML, infoY + 46);
        }

        // Right column: meta — label col + value col
        // Right half starts at x=310, value at x=420, ends at PW-MR=547
        const metaLabelX = 310;
        const metaValX   = 420;
        const metaValW   = PW - MR - metaValX;  // 127px — plenty of room

        const metaRows = [
            ['Invoice No.',    `#${order.orderId}`,    true],
            ['Issue Date',     new Date(order.orderDate).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                               }), false],
            ['Payment ID',     order.razorpayPaymentId || '—', false],
            ['Payment Method', order.paymentMethod
                                    ? order.paymentMethod.charAt(0).toUpperCase() + order.paymentMethod.slice(1)
                                    : 'Razorpay', false],
        ];

        let mY = infoY;
        metaRows.forEach(([label, value, highlight]) => {
            doc.font(FONT_REGULAR).fontSize(8).fillColor(GRAY).text(label, metaLabelX, mY);
            doc.font(highlight ? FONT_BOLD : FONT_REGULAR)
               .fontSize(highlight ? 10 : 9)
               .fillColor(highlight ? PURPLE : DARK)
               .text(value, metaValX, mY, { width: metaValW, lineBreak: false });
            mY += 19;
        });

        // Divider
        const divY = infoY + 96;
        doc.moveTo(ML, divY).lineTo(PW - MR, divY).strokeColor(BORDER).lineWidth(1).stroke();

        // ════════════════════════════════════════════════════════════════
        // TABLE
        // ════════════════════════════════════════════════════════════════
        const tblY = divY + 10;

        // Column layout — all right-aligned within fixed-width boxes
        // |  COURSE (left)  |  ORIGINAL 70px  |  DISCOUNT 70px  |  AMOUNT 80px  |
        const COL_AMT_W    = 80;
        const COL_DISC_W   = 70;
        const COL_ORIG_W   = 70;
        const COL_AMT      = PW - MR - COL_AMT_W;          // x=467, width=80
        const COL_DISC     = COL_AMT - COL_DISC_W - 8;     // x=389, width=70
        const COL_ORIG     = COL_DISC - COL_ORIG_W - 8;    // x=311, width=70
        const COL_COURSE   = ML;

        // Header row background
        doc.rect(ML, tblY, CW, 26).fill(LIGHT_GRAY);

        doc.font(FONT_BOLD).fontSize(8).fillColor(GRAY);
        doc.text('COURSE / INSTRUCTOR', COL_COURSE + 8, tblY + 9);
        doc.text('ORIGINAL', COL_ORIG,  tblY + 9, { align: 'right', width: COL_ORIG_W });
        doc.text('DISCOUNT', COL_DISC,  tblY + 9, { align: 'right', width: COL_DISC_W });
        doc.text('AMOUNT',   COL_AMT,   tblY + 9, { align: 'right', width: COL_AMT_W });

        // Rows
        let rowY = tblY + 34;
        order.courses.forEach((item, idx) => {
            const title      = item.courseTitle || item.course?.title || 'Course';
            const instructor = item.tutor?.name || '';
            const original   = item.originalPrice || item.discountedPrice;
            const discounted = item.discountedPrice;
            const disc       = original - discounted;
            const rowH       = instructor ? 38 : 28;

            // Alternating tint
            if (idx % 2 === 1) {
                doc.rect(ML, rowY - 4, CW, rowH + 4).fill('#faf8ff');
            }

            const courseColW = COL_ORIG - COL_COURSE - 16;

            doc.font(FONT_BOLD).fontSize(10).fillColor(DARK)
                .text(title, COL_COURSE + 8, rowY, { width: courseColW, ellipsis: true });

            if (instructor) {
                doc.font(FONT_REGULAR).fontSize(8).fillColor(GRAY)
                    .text(`Instructor: ${instructor}`, COL_COURSE + 8, rowY + 14,
                        { width: courseColW });
            }

            doc.font(FONT_REGULAR).fontSize(9).fillColor(GRAY)
                .text(INR(original), COL_ORIG, rowY, { align: 'right', width: COL_ORIG_W });

            if (disc > 0) {
                doc.font(FONT_BOLD).fontSize(9).fillColor(GREEN)
                    .text(`-${INR(disc)}`, COL_DISC, rowY, { align: 'right', width: COL_DISC_W });
            } else {
                doc.font(FONT_REGULAR).fontSize(9).fillColor(GRAY)
                    .text('—', COL_DISC, rowY, { align: 'right', width: COL_DISC_W });
            }

            doc.font(FONT_BOLD).fontSize(10).fillColor(DARK)
                .text(INR(discounted), COL_AMT, rowY, { align: 'right', width: COL_AMT_W });

            rowY += rowH + 8;

            // Row separator
            doc.moveTo(ML, rowY - 4).lineTo(PW - MR, rowY - 4)
                .strokeColor(BORDER).lineWidth(0.4).stroke();
        });

        // ════════════════════════════════════════════════════════════════
        // SUMMARY — right-aligned block
        // ════════════════════════════════════════════════════════════════
        const sumY    = rowY + 12;
        const sumLX   = 360;
        const sumVX   = PW - MR;
        const sumW    = sumVX - sumLX;
        let   curSumY = sumY;

        const sumRow = (label, value, bold = false, color = DARK) => {
            doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(9)
               .fillColor(GRAY).text(label, sumLX, curSumY);
            doc.font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(9)
               .fillColor(color).text(value, sumLX, curSumY, { align: 'right', width: sumW });
            curSumY += 18;
        };

        sumRow('Subtotal', INR(order.subtotal));

        if (order.discount > 0) {
            const couponLabel = order.couponCode ? `Coupon (${order.couponCode})` : 'Discount';
            sumRow(couponLabel, `-${INR(order.discount)}`, false, GREEN);
        }
        if (order.offerApplied) {
            sumRow(`Offer: ${order.offerApplied}`, '', false, GREEN);
        }

        // Thin line above total
        curSumY += 4;
        doc.moveTo(sumLX, curSumY).lineTo(PW - MR, curSumY)
            .strokeColor(BORDER).lineWidth(0.5).stroke();
        curSumY += 8;

        // ── Total banner ──────────────────────────────────────────────
        const totalY = curSumY;
        doc.rect(ML, totalY, CW, 46).fill(PURPLE_MID);
        doc.font(FONT_BOLD).fontSize(13).fillColor(WHITE)
            .text('Total (INR)', ML + 16, totalY + 15);
        doc.font(FONT_BOLD).fontSize(16).fillColor(WHITE)
            .text(INR(order.finalAmount), ML + 16, totalY + 13,
                { align: 'right', width: CW - 32 });

        // ── Payment received badge ────────────────────────────────────
        const badgeY = totalY + 56;
        const badgeW = 170;
        const badgeX = PW - MR - badgeW;
        doc.rect(badgeX, badgeY, badgeW, 24).fill(GREEN_LIGHT);
        doc.font(FONT_BOLD).fontSize(9).fillColor(GREEN)
            .text('\u2713  PAYMENT RECEIVED', badgeX, badgeY + 8,
                { align: 'center', width: badgeW });

        // ════════════════════════════════════════════════════════════════
        // THANK YOU CARD
        // ════════════════════════════════════════════════════════════════
        const thankY = badgeY + 50;

        // Light purple card background
        doc.rect(ML, thankY, CW, 80).fill(PURPLE_LIGHT);

        // Left accent bar
        doc.rect(ML, thankY, 4, 80).fill(PURPLE_MID);

        doc.font(FONT_BOLD).fontSize(14).fillColor(PURPLE)
            .text('Thank you for learning with Cognon!', ML + 20, thankY + 16);
        doc.font(FONT_REGULAR).fontSize(9).fillColor(GRAY)
            .text(
                'We hope you enjoy your course. If you have any questions or need support,\nfeel free to reach out to us at support@cognon.com',
                ML + 20, thankY + 36,
                { width: CW - 40, lineGap: 3 }
            );

        // ════════════════════════════════════════════════════════════════
        // FOOTER
        // ════════════════════════════════════════════════════════════════
        // Fixed at bottom of page
        doc.rect(0, PH - 56, PW, 56).fill(PURPLE);

        doc.font(FONT_REGULAR).fontSize(8).fillColor('#c4b5fd')
            .text(
                'This is a computer-generated invoice and does not require a signature.',
                0, PH - 40,
                { align: 'center', width: PW }
            );
        doc.font(FONT_BOLD).fontSize(9).fillColor(WHITE)
            .text(
                'Cognon  \u2022  Online Learning Platform  \u2022  support@cognon.com',
                0, PH - 24,
                { align: 'center', width: PW }
            );

        doc.end();
    }
};

module.exports = invoiceService;
