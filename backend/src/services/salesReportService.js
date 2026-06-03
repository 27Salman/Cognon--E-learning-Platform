const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const fmt = (n) => `Rs.${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const salesReportService = {

    generateSalesPDF(reportData, res) {
        const { summary, chartData, orders, dateFrom, dateTo } = reportData;

        const pathMod = require('path');
        const FONT_REGULAR = pathMod.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf');
        const FONT_BOLD    = pathMod.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf');
        const INR = (n) => '\u20B9' + Number(n || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });

        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`);
        doc.pipe(res);

        // ── Palette ───────────────────────────────────────────────────
        const PURPLE       = '#6d28d9';
        const PURPLE_MID   = '#7c3aed';
        const PURPLE_LIGHT = '#ede9fe';
        const WHITE        = '#ffffff';
        const DARK         = '#111827';
        const GRAY         = '#6b7280';
        const LIGHT_GRAY   = '#f9fafb';
        const BORDER       = '#e5e7eb';

        const PW = 595.28;
        const ML = 40;
        const MR = 40;
        const CW = PW - ML - MR;  // 515.28

        // ── Header band ───────────────────────────────────────────────
        doc.rect(0, 0, PW, 80).fill(PURPLE);
        doc.font(FONT_BOLD).fontSize(22).fillColor(WHITE)
            .text('Cognon \u2014 Sales Report', ML, 20);

        const dateRange = dateFrom && dateTo
            ? `${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}`
            : 'All Time';
        doc.font(FONT_REGULAR).fontSize(9).fillColor('#c4b5fd')
            .text(`Period: ${dateRange}`, ML, 52);

        doc.rect(0, 80, PW, 3).fill('#4c1d95');

        doc.font(FONT_REGULAR).fontSize(8).fillColor(GRAY)
            .text(`Generated: ${new Date().toLocaleString('en-IN')}`, ML, 92);

        // ── Summary cards — 3 per row, 2 rows ─────────────────────────
        const cardW   = (CW - 20) / 3;  // ~165px, 10px gap
        const cardH   = 58;
        const cardGap = 10;
        const cards = [
            { label: 'Total Revenue',    value: INR(summary.totalRevenue),         highlight: true },
            { label: 'Tutor Payouts',    value: INR(summary.totalTutorRevenue),     highlight: false },
            { label: 'Platform Revenue', value: INR(summary.totalPlatformRevenue),  highlight: false },
            { label: 'Total Orders',     value: String(summary.totalOrders),        highlight: false },
            { label: 'Razorpay Orders',  value: String(summary.paymentMethods?.razorpay?.count || 0), highlight: false },
            { label: 'Wallet Orders',    value: String(summary.paymentMethods?.wallet?.count || 0),   highlight: false },
        ];

        const cardStartY = 108;
        cards.forEach((card, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = ML + col * (cardW + cardGap);
            const cy = cardStartY + row * (cardH + 8);

            doc.rect(cx, cy, cardW, cardH).fill(card.highlight ? PURPLE_MID : LIGHT_GRAY);
            doc.font(FONT_REGULAR).fontSize(8)
               .fillColor(card.highlight ? '#c4b5fd' : GRAY)
               .text(card.label, cx + 10, cy + 10, { width: cardW - 20 });
            doc.font(FONT_BOLD).fontSize(14)
               .fillColor(card.highlight ? WHITE : DARK)
               .text(card.value, cx + 10, cy + 26, { width: cardW - 20 });
        });

        // ── Period Breakdown table ─────────────────────────────────────
        // Period(90) | Orders(45) | Revenue(105) | Platform(105) | Tutor Payout(105)
        // Widths = 450, gaps (4×16) = 64 → total = 514 ≈ CW ✓
        let y = cardStartY + 2 * (cardH + 8) + 20;

        doc.font(FONT_BOLD).fontSize(11).fillColor(DARK).text('Period Breakdown', ML, y);
        y += 16;

        const P_COLS = (() => {
            const widths = [90, 45, 105, 105, 105];
            const gaps   = [0,  16,  16,  16,  16];
            const xs = [];
            let cur = ML;
            widths.forEach((w, i) => { xs.push({ x: cur, w }); cur += w + gaps[i]; });
            return xs;
        })();
        const P_HEADS = ['Period', 'Orders', 'Revenue', 'Platform', 'Tutor Payout'];

        doc.rect(ML, y, CW, 22).fill(PURPLE_LIGHT);
        doc.font(FONT_BOLD).fontSize(8).fillColor(PURPLE_MID);
        P_HEADS.forEach((h, i) => {
            const align = i === 0 ? 'left' : 'right';
            doc.text(h, P_COLS[i].x + (i === 0 ? 6 : 0), y + 7,
                { width: P_COLS[i].w, align });
        });
        y += 24;

        doc.font(FONT_REGULAR).fontSize(8).fillColor(DARK);
        chartData.forEach((row, idx) => {
            if (y > 730) { doc.addPage(); y = 50; }
            if (idx % 2 === 1) doc.rect(ML, y - 2, CW, 16).fill('#faf8ff');
            doc.fillColor(DARK);
            const pVals = [
                row.period,
                String(row.orders),
                INR(row.revenue),
                INR(row.platformRevenue),
                INR(row.tutorRevenue),
            ];
            pVals.forEach((v, i) => {
                const align = i === 0 ? 'left' : 'right';
                doc.text(v, P_COLS[i].x + (i === 0 ? 6 : 0), y,
                    { width: P_COLS[i].w, align, lineBreak: false });
            });
            y += 16;
            doc.moveTo(ML, y - 1).lineTo(ML + CW, y - 1)
                .strokeColor(BORDER).lineWidth(0.3).stroke();
        });

        // ── Order Details table ────────────────────────────────────────
        // Order ID(100) | Student(65) | Course(115) | Amount(60) | Tutor(60) | Date(55) | Coupon(50)
        // Widths = 505, gaps (6×2) = 12 → total = 517 ≈ CW ✓
        y += 16;
        if (y > 680) { doc.addPage(); y = 50; }

        doc.font(FONT_BOLD).fontSize(11).fillColor(DARK).text('Order Details', ML, y);
        y += 16;

        const O_COLS = (() => {
            // Order ID(95) | Student(62) | Course(112) | Amount(58) | Tutor(58) | Date(52) | Coupon(48)
            // Widths = 485, gaps (6×5) = 30 → total = 515 = CW ✓
            const widths = [95, 62, 112, 58, 58, 52, 48];
            const gaps   = [0,   5,   5,   5,  5,  5,  5];
            const xs = [];
            let cur = ML;
            widths.forEach((w, i) => { xs.push({ x: cur, w }); cur += w + gaps[i]; });
            return xs;
        })();
        const O_HEADS = ['Order ID', 'Student', 'Course', 'Amount', 'Tutor', 'Date', 'Coupon'];

        doc.rect(ML, y, CW, 22).fill(PURPLE_LIGHT);
        doc.font(FONT_BOLD).fontSize(7.5).fillColor(PURPLE_MID);
        O_HEADS.forEach((h, i) => {
            const align = i <= 2 ? 'left' : 'right';
            doc.text(h, O_COLS[i].x + (i <= 2 ? 4 : 0), y + 7,
                { width: O_COLS[i].w, align });
        });
        y += 24;

        const trunc = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '\u2026' : (s || '-');
        let rowIdx = 0;
        doc.font(FONT_REGULAR).fontSize(7.5).fillColor(DARK);

        for (const order of orders) {
            for (const courseItem of order.courses) {
                if (y > 760) { doc.addPage(); y = 50; }
                if (rowIdx % 2 === 1) doc.rect(ML, y - 2, CW, 15).fill('#faf8ff');
                doc.fillColor(DARK);

                const vals = [
                    trunc(order.orderId, 18),
                    trunc(order.user?.name || '-', 11),
                    trunc(courseItem.courseTitle || '-', 20),
                    INR(courseItem.discountedPrice || 0),
                    trunc(courseItem.tutor?.name || '-', 10),
                    new Date(order.orderDate).toLocaleDateString('en-IN'),
                    trunc(order.couponCode || '-', 9),
                ];
                vals.forEach((v, i) => {
                    const align = i <= 2 ? 'left' : 'right';
                    doc.text(v, O_COLS[i].x + (i <= 2 ? 4 : 0), y,
                        { width: O_COLS[i].w, align, lineBreak: false });
                });
                y += 15;
                rowIdx++;

                doc.moveTo(ML, y - 1).lineTo(ML + CW, y - 1)
                    .strokeColor(BORDER).lineWidth(0.3).stroke();
            }
        }

        // ── Footer ────────────────────────────────────────────────────
        const PH = 841.89;
        doc.rect(0, PH - 40, PW, 40).fill(PURPLE);
        doc.font(FONT_BOLD).fontSize(8).fillColor(WHITE)
            .text('Cognon Learning Platform \u2022 Confidential', 0, PH - 24,
                { align: 'center', width: PW });

        doc.end();
    },

    async generateSalesExcel(reportData, res) {
        const { summary, chartData, orders, dateFrom, dateTo } = reportData;
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Cognon Admin';
        workbook.created = new Date();
        const purpleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
        const headerFont = { bold: true, color: { argb: 'FF7C3AED' } };

        // Summary 
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 28 },
            { header: 'Value',  key: 'value',  width: 22 },
        ];
        summarySheet.getRow(1).font = headerFont;
        summarySheet.getRow(1).fill = purpleFill;
        summarySheet.addRows([
            { metric: 'Report Period',          value: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time' },
            { metric: 'Total Revenue (Rs.)',    value: Math.round(summary.totalRevenue) },
            { metric: 'Tutor Payouts (Rs.)',    value: Math.round(summary.totalTutorRevenue) },
            { metric: 'Platform Revenue (Rs.)', value: Math.round(summary.totalPlatformRevenue) },
            { metric: 'Total Orders',           value: summary.totalOrders },
            { metric: 'Razorpay Orders',        value: summary.paymentMethods?.razorpay?.count || 0 },
            { metric: 'Razorpay Revenue (Rs.)', value: Math.round(summary.paymentMethods?.razorpay?.revenue || 0) },
            { metric: 'Wallet Orders',          value: summary.paymentMethods?.wallet?.count || 0 },
            { metric: 'Wallet Revenue (Rs.)',    value: Math.round(summary.paymentMethods?.wallet?.revenue || 0) },
        ]);

        // Period
        const periodSheet = workbook.addWorksheet('Period Breakdown');
        periodSheet.columns = [
            { header: 'Period',                 key: 'period',         width: 15 },
            { header: 'Orders',                 key: 'orders',         width: 10 },
            { header: 'Revenue (Rs.)',           key: 'revenue',        width: 20 },
            { header: 'Platform Revenue (Rs.)', key: 'platformRevenue', width: 24 },
            { header: 'Tutor Payout (Rs.)',      key: 'tutorRevenue',   width: 22 },
        ];
        periodSheet.getRow(1).font = headerFont;
        periodSheet.getRow(1).fill = purpleFill;
        chartData.forEach(row => periodSheet.addRow(row));

        // Orders  
        const ordersSheet = workbook.addWorksheet('Orders');
        ordersSheet.columns = [
            { header: 'Order ID',           key: 'orderId',       width: 26 },
            { header: 'Student Name',       key: 'studentName',   width: 22 },
            { header: 'Student Email',      key: 'studentEmail',  width: 30 },
            { header: 'Category',           key: 'category',      width: 20 },
            { header: 'Course',             key: 'courseName',    width: 32 },
            { header: 'Original Price (Rs.)', key: 'originalPrice', width: 20 },
            { header: 'Discount (Rs.)',     key: 'discount',      width: 16 },
            { header: 'Amount Paid (Rs.)',  key: 'amount',        width: 18 },
            { header: 'Tutor Name',         key: 'tutorName',     width: 22 },
            { header: 'Date',               key: 'date',          width: 15 },
            { header: 'Coupon',             key: 'coupon',        width: 15 },
            { header: 'Status',             key: 'status',        width: 16 },
        ];
        ordersSheet.getRow(1).font = headerFont;
        ordersSheet.getRow(1).fill = purpleFill;

        for (const order of orders) {
            for (const courseItem of order.courses) {
                ordersSheet.addRow({
                    orderId:       order.orderId,
                    studentName:   order.user?.name           || '-',
                    studentEmail:  order.user?.email          || '-',
                    category:      courseItem.courseCategory  || '-',
                    courseName:    courseItem.courseTitle     || '-',
                    originalPrice: courseItem.originalPrice   || 0,
                    discount:      order.discount             || 0,
                    amount:        courseItem.discountedPrice || 0,
                    tutorName:     courseItem.tutor?.name     || '-',
                    date:          new Date(order.orderDate).toLocaleDateString('en-IN'),
                    coupon:        order.couponCode || '-',
                    status:        order.paymentStatus,
                });
            }
        }

        ordersSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();
    },

    generateTutorPDF(reportData, tutorName, res){
        const { summary, courseBreakdown, transactions, dateFrom, dateTo } = reportData;

        const path = require('path');
        const FONT_REGULAR = path.join(__dirname, '../../assets/fonts/Roboto-Regular.ttf');
        const FONT_BOLD    = path.join(__dirname, '../../assets/fonts/Roboto-Bold.ttf');
        const INR = (n) => '\u20B9' + Number(n || 0).toLocaleString('en-IN', {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });

        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=tutor-sales-${Date.now()}.pdf`);
        doc.pipe(res);

        // ── Palette ───────────────────────────────────────────────────
        const PURPLE      = '#6d28d9';
        const PURPLE_MID  = '#7c3aed';
        const PURPLE_LIGHT = '#ede9fe';
        const WHITE       = '#ffffff';
        const DARK        = '#111827';
        const GRAY        = '#6b7280';
        const LIGHT_GRAY  = '#f9fafb';
        const BORDER      = '#e5e7eb';
        const GREEN       = '#059669';

        const PW = 595.28;
        const ML = 40;
        const MR = 40;
        const CW = PW - ML - MR;  // 515.28

        // ── Header band ───────────────────────────────────────────────
        doc.rect(0, 0, PW, 90).fill(PURPLE);
        doc.font(FONT_BOLD).fontSize(22).fillColor(WHITE)
            .text('Cognon \u2014 Earnings Report', ML, 20);

        const dateRange = dateFrom && dateTo
            ? `${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}`
            : 'All Time';

        doc.font(FONT_REGULAR).fontSize(9).fillColor('#c4b5fd')
            .text(`Tutor: ${tutorName}`, ML, 52)
            .text(`Period: ${dateRange}`, ML + 200, 52);

        doc.rect(0, 90, PW, 3).fill('#4c1d95');

        // Generated timestamp
        doc.font(FONT_REGULAR).fontSize(8).fillColor(GRAY)
            .text(`Generated: ${new Date().toLocaleString('en-IN')}`, ML, 102);

        // ── Summary cards — 3 per row, 2 rows ─────────────────────────
        const cardW = (CW - 20) / 3;  // ~165px each, 10px gap
        const cardH = 58;
        const cardGap = 10;
        const cards = [
            { label: 'Your Earnings',   value: INR(summary.totalEarnings),    highlight: true },
            { label: 'Gross Revenue',   value: INR(summary.totalGross),        highlight: false },
            { label: 'Platform Fee',    value: INR(summary.platformFee),       highlight: false },
            { label: 'Total Sales',     value: String(summary.totalEnrollments), highlight: false },
            { label: 'Razorpay Orders', value: String(summary.paymentMethods?.razorpay?.count || 0), highlight: false },
            { label: 'Wallet Orders',   value: String(summary.paymentMethods?.wallet?.count || 0),   highlight: false },
        ];

        let cardY = 118;
        cards.forEach((card, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const cx = ML + col * (cardW + cardGap);
            const cy = cardY + row * (cardH + 8);

            doc.rect(cx, cy, cardW, cardH).fill(card.highlight ? PURPLE_MID : LIGHT_GRAY);
            doc.font(FONT_REGULAR).fontSize(8)
               .fillColor(card.highlight ? '#c4b5fd' : GRAY)
               .text(card.label, cx + 10, cy + 10, { width: cardW - 20 });
            doc.font(FONT_BOLD).fontSize(14)
               .fillColor(card.highlight ? WHITE : DARK)
               .text(card.value, cx + 10, cy + 26, { width: cardW - 20 });
        });

        // ── Earnings by Course table ───────────────────────────────────
        // Columns: Course(165) | Sales(40) | Avg Price(75) | Gross(75) | Earnings(75) | Category(65)
        // Total = 165+40+75+75+75+65 = 495 + 5 gaps of 4 = 515 ✓
        let y = cardY + 2 * (cardH + 8) + 20;

        doc.font(FONT_BOLD).fontSize(11).fillColor(DARK).text('Earnings by Course', ML, y);
        y += 16;

        // Column definitions — x positions computed from widths
        // Course(160) | Sales(38) | Avg Price(72) | Gross(72) | Earnings(72) | Category(61)
        // Widths sum = 475, gaps (5×8) = 40 → total = 515 = CW ✓
        const C_COLS = (() => {
            const widths = [160, 38, 72, 72, 72, 61];
            const gaps   = [0,    8,  8,  8,  8,  8];
            const xs = [];
            let cur = ML;
            widths.forEach((w, i) => { xs.push({ x: cur, w }); cur += w + gaps[i]; });
            return xs;
        })();
        const C_HEADS = ['Course', 'Sales', 'Avg Price', 'Gross', 'Your Earnings', 'Category'];

        // Header row
        doc.rect(ML, y, CW, 22).fill(PURPLE_LIGHT);
        doc.font(FONT_BOLD).fontSize(7.5).fillColor(PURPLE_MID);
        C_HEADS.forEach((h, i) => {
            const align = i === 0 ? 'left' : 'right';
            doc.text(h, C_COLS[i].x + (i === 0 ? 6 : 0), y + 7,
                { width: C_COLS[i].w, align });
        });
        y += 24;

        doc.font(FONT_REGULAR).fontSize(8).fillColor(DARK);
        courseBreakdown.forEach((c, idx) => {
            if (y > 730) { doc.addPage(); y = 50; }
            if (idx % 2 === 1) doc.rect(ML, y - 2, CW, 16).fill('#faf8ff');
            doc.fillColor(DARK);

            const trunc = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '\u2026' : (s || '-');
            const vals = [
                trunc(c.courseTitle, 28),
                String(c.enrollments),
                INR(c.avgSalePrice),
                INR(c.grossRevenue),
                INR(c.earnings),
                c.courseCategory || '-',
            ];
            vals.forEach((v, i) => {
                const align = i === 0 ? 'left' : 'right';
                doc.text(v, C_COLS[i].x + (i === 0 ? 6 : 0), y,
                    { width: C_COLS[i].w, align, lineBreak: false });
            });
            y += 16;

            // Row separator
            doc.moveTo(ML, y - 1).lineTo(ML + CW, y - 1)
                .strokeColor(BORDER).lineWidth(0.3).stroke();
        });

        // ── Transaction Details table ──────────────────────────────────
        // Columns: Date(60) | Course(150) | Student(80) | Sale Price(75) | Earnings(75) | Coupon(60)
        // Total = 60+150+80+75+75+60 = 500 + 5 gaps of 3 = 515 ✓
        y += 16;
        if (y > 680) { doc.addPage(); y = 50; }

        doc.font(FONT_BOLD).fontSize(11).fillColor(DARK).text('Transaction Details', ML, y);
        y += 16;

        const T_COLS = (() => {
            // Date(55) | Course(145) | Student(75) | Sale Price(70) | Earnings(70) | Coupon(55)
            // Widths sum = 470, gaps (5×9) = 45 → total = 515 = CW ✓
            const widths = [55, 145, 75, 70, 70, 55];
            const gaps   = [0,   9,   9,  9,  9,  9];
            const xs = [];
            let cur = ML;
            widths.forEach((w, i) => { xs.push({ x: cur, w }); cur += w + gaps[i]; });
            return xs;
        })();
        const T_HEADS = ['Date', 'Course', 'Student', 'Sale Price', 'Earnings', 'Coupon'];

        // Header row
        doc.rect(ML, y, CW, 22).fill(PURPLE_LIGHT);
        doc.font(FONT_BOLD).fontSize(7.5).fillColor(PURPLE_MID);
        T_HEADS.forEach((h, i) => {
            const align = i <= 2 ? 'left' : 'right';
            doc.text(h, T_COLS[i].x + (i <= 2 ? 4 : 0), y + 7,
                { width: T_COLS[i].w, align });
        });
        y += 24;

        let rowIdx = 0;
        doc.font(FONT_REGULAR).fontSize(7.5).fillColor(DARK);
        transactions.forEach(t => {
            if (y > 760) { doc.addPage(); y = 50; }
            if (rowIdx % 2 === 1) doc.rect(ML, y - 2, CW, 15).fill('#faf8ff');
            doc.fillColor(DARK);

            const trunc = (s, n) => s && s.length > n ? s.slice(0, n - 1) + '\u2026' : (s || '-');
            const vals = [
                new Date(t.date).toLocaleDateString('en-IN'),
                trunc(t.courseTitle, 24),
                trunc(t.student, 14),
                INR(t.salePrice),
                INR(t.earnings),
                t.coupon || '-',
            ];
            vals.forEach((v, i) => {
                const align = i <= 2 ? 'left' : 'right';
                doc.text(v, T_COLS[i].x + (i <= 2 ? 4 : 0), y,
                    { width: T_COLS[i].w, align, lineBreak: false });
            });
            y += 15;
            rowIdx++;

            doc.moveTo(ML, y - 1).lineTo(ML + CW, y - 1)
                .strokeColor(BORDER).lineWidth(0.3).stroke();
        });

        // ── Footer ────────────────────────────────────────────────────
        const PH = 841.89;
        doc.rect(0, PH - 40, PW, 40).fill(PURPLE);
        doc.font(FONT_BOLD).fontSize(8).fillColor(WHITE)
            .text('Cognon Learning Platform \u2022 Confidential', 0, PH - 24,
                { align: 'center', width: PW });

        doc.end();
    },

    async generateTutorExcel(reportData, tutorName, res){
        const { summary, courseBreakdown, transactions, dateFrom, dateTo } = reportData;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Cognon Tutor';
        workbook.created = new Date();

        const purpleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDE9FE' } };
        const headerFont = { bold: true, color: { argb: 'FF7C3AED' } };

        // Summary 
        const summarySheet = workbook.addWorksheet('Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 28 },
            { header: 'Value',  key: 'value',  width: 22 },
        ];
        summarySheet.getRow(1).font = headerFont;
        summarySheet.getRow(1).fill = purpleFill;
        summarySheet.addRows([
            { metric: 'Tutor',                  value: tutorName },
            { metric: 'Report Period',           value: dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All Time' },
            { metric: 'Your Earnings (Rs.)',     value: summary.totalEarnings },
            { metric: 'Gross Revenue (Rs.)',     value: summary.totalGross },
            { metric: 'Platform Fee (Rs.)',      value: summary.platformFee },
            { metric: 'Total Sales',             value: summary.totalEnrollments },
            { metric: 'Courses with Sales',      value: summary.totalCourses },
            { metric: 'Razorpay Orders',        value: summary.paymentMethods?.razorpay?.count || 0 },
            { metric: 'Razorpay Earnings (Rs.)', value: Math.round(summary.paymentMethods?.razorpay?.revenue || 0) },
            { metric: 'Wallet Orders',          value: summary.paymentMethods?.wallet?.count || 0 },
            { metric: 'Wallet Earnings (Rs.)',    value: Math.round(summary.paymentMethods?.wallet?.revenue || 0) },
        ]);

        // Course 
        const courseSheet = workbook.addWorksheet('Earnings by Course');
        courseSheet.columns = [
            { header: 'Course',          key: 'courseTitle',    width: 35 },
            { header: 'Category',        key: 'courseCategory', width: 20 },
            { header: 'Sales',           key: 'enrollments',    width: 10 },
            { header: 'Avg Sale Price',  key: 'avgSalePrice',   width: 18 },
            { header: 'Gross Revenue',   key: 'grossRevenue',   width: 18 },
            { header: 'Your Earnings',   key: 'earnings',       width: 18 },
        ];
        courseSheet.getRow(1).font = headerFont;
        courseSheet.getRow(1).fill = purpleFill;
        courseBreakdown.forEach(c => courseSheet.addRow(c));

        // Transactions 
        const txSheet = workbook.addWorksheet('Transactions');
        txSheet.columns = [
            { header: 'Date',       key: 'date',      width: 15 },
            { header: 'Course',     key: 'course',    width: 35 },
            { header: 'Student',    key: 'student',   width: 20 },
            { header: 'Sale Price', key: 'salePrice', width: 15 },
            { header: 'Earnings',   key: 'earnings',  width: 15 },
            { header: 'Coupon',     key: 'coupon',    width: 15 },
        ];
        txSheet.getRow(1).font = headerFont;
        txSheet.getRow(1).fill = purpleFill;
        transactions.forEach(t => txSheet.addRow({
            date:      new Date(t.date).toLocaleDateString('en-IN'),
            course:    t.courseTitle,
            student:   t.student,
            salePrice: t.salePrice,
            earnings:  t.earnings,
            coupon:    t.coupon,
        }));

        txSheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1 && rowNumber % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                });
            }
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=earnings-report-${Date.now()}.xlsx`);
        await workbook.xlsx.write(res);
        res.end();

    },
};

module.exports = salesReportService;



