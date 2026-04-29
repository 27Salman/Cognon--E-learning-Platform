const PDFDocument = require('pdfkit');
const Order = require('../models/Order');

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
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=invoice-${order.orderId}.pdf`
        );
        doc.pipe(res);

        const purple = '#7c3aed';
        const lightPurple = '#ede9fe';
        const dark = '#111827';
        const gray = '#6b7280';
        const lightGray = '#f9fafb';
        const borderGray = '#e5e7eb';

        const pageW = 595;
        const margin = 50;
        const cardW = pageW - margin * 2;

        //Outer card
        doc.rect(margin, 40, cardW, 700).fill(lightPurple);

        //Inner card
        const cardX = margin + 20;
        const cardY = 60;
        const innerW = cardW - 40;
        doc.rect(cardX, cardY, innerW, 660).fill('#ffffff');

        //title 
        doc.fontSize(20).font('Helvetica-Bold').fillColor(dark).text('Invoice', cardX + 20, cardY + 20);

        //Billed To 
        doc.fontSize(9).font('Helvetica').fillColor(gray).text('Billed To:', cardX + 20, cardY + 55);
        const firstCourse = order.courses[0];
        const billedName = firstCourse?.courseTitle || firstCourse?.course?.title || order.user.name;
        doc.fontSize(11).font('Helvetica-Bold').fillColor(dark).text(billedName, cardX + 20, cardY + 68);

        //Invoice meta 
        const metaX = cardX + innerW - 160;
        doc.fontSize(9).font('Helvetica').fillColor(gray).text('Invoice No.', metaX, cardY + 20);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(purple).text(`#${order.orderId}`, metaX, cardY + 33);

        doc.fontSize(9).font('Helvetica').fillColor(gray).text('Issued on', metaX, cardY + 55);
        doc.fontSize(9).font('Helvetica').fillColor(dark).text(
            new Date(order.orderDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            metaX, cardY + 68
        );

        if (order.razorpayPaymentId) {
            doc.fontSize(9).font('Helvetica').fillColor(gray).text('Payment ID', metaX, cardY + 88);
            doc.fontSize(8).font('Helvetica').fillColor(dark).text(order.razorpayPaymentId, metaX, cardY + 101, { width: 150 });
        }

        //Divider 
        const divY = cardY + 130;
        doc.moveTo(cardX + 20, divY).lineTo(cardX + innerW - 20, divY)
            .strokeColor(borderGray).lineWidth(1).stroke();

        //Services table header 
        const tblY = divY + 15;
        const col1 = cardX + 20;
        const col2 = cardX + innerW - 200;
        const col3 = cardX + innerW - 120;
        const col4 = cardX + innerW - 50;

        doc.fontSize(9).font('Helvetica-Bold').fillColor(gray);
        doc.text('Services', col1, tblY);
        doc.text('Qty.', col2, tblY, { align: 'right', width: 60 });
        doc.text('Price', col3, tblY, { align: 'right', width: 60 });
        doc.text('Total', col4, tblY, { align: 'right', width: 40 });

        doc.moveTo(cardX + 20, tblY + 14).lineTo(cardX + innerW - 20, tblY + 14)
            .strokeColor(borderGray).lineWidth(0.5).stroke();

        //rows 
        let rowY = tblY + 22;
        order.courses.forEach((item) => {
            const title = item.courseTitle || item.course?.title || 'Course';
            const price = item.discountedPrice;

            doc.fontSize(9).font('Helvetica').fillColor(dark);
            doc.text(title, col1, rowY, { width: col2 - col1 - 10, ellipsis: true });
            doc.text('1', col2, rowY, { align: 'right', width: 60 });
            doc.text(`₹${price.toLocaleString('en-IN')}.00`, col3, rowY, { align: 'right', width: 60 });
            doc.text(`₹${price.toLocaleString('en-IN')}.00`, col4, rowY, { align: 'right', width: 40 });
            rowY += 22;
        });

        //Total box 
        const totalBoxY = rowY + 15;
        const totalBoxW = 200;
        const totalBoxX = cardX + innerW - totalBoxW - 20;

        doc.rect(totalBoxX, totalBoxY, totalBoxW, 36).fill(purple);
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff');
        doc.text('Total (INR)', totalBoxX + 12, totalBoxY + 12);
        doc.text(
            `₹${order.finalAmount.toLocaleString('en-IN')}.00`,
            totalBoxX + 12, totalBoxY + 12,
            { align: 'right', width: totalBoxW - 24 }
        );

        //Footer  
        const footY = totalBoxY + 60;
        doc.fontSize(8).font('Helvetica').fillColor(gray)
            .text('Thank you for learning with Cognon!', cardX + 20, footY, {
                align: 'center', width: innerW - 40
            });

        doc.end();
    }
};

module.exports = invoiceService;
