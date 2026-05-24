const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

const fmt = (n) => `Rs.${Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const salesReportService = {

    generateSalesPDF(reportData, res) {
        const { summary, chartData, orders, dateFrom, dateTo } = reportData;
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`);
        doc.pipe(res);

        const purple = '#7c3aed';
        const dark   = '#111827';
        const gray   = '#6b7280';
        const border = '#e5e7eb';
        const light  = '#f5f3ff';

        doc.rect(0, 0, 595, 80).fill(purple);
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff').text('Cognon - Sales Report', 50, 25);

        const dateRange = dateFrom && dateTo
            ? `${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}`
            : 'All Time';
        doc.fontSize(10).font('Helvetica').fillColor('#e9d5ff').text(`Period: ${dateRange}`, 50, 55);
        doc.fontSize(9).fillColor(gray).text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50, 90);

        // Summary
        const boxes = [
            { label: 'Total Revenue',    value: fmt(summary.totalRevenue) },
            { label: 'Tutor Payouts',    value: fmt(summary.totalTutorRevenue) },
            { label: 'Platform Revenue', value: fmt(summary.totalPlatformRevenue) },
            { label: 'Total Orders',     value: String(summary.totalOrders) },
            { label: 'Razorpay Orders',  value: String(summary.paymentMethods?.razorpay?.count || 0) },
            { label: 'Wallet Orders',    value: String(summary.paymentMethods?.wallet?.count || 0) },
        ];
        const boxW = 115, boxH = 55, boxY = 110, gap = 10;
        boxes.forEach((b, i) => {
            const bx = 50 + i * (boxW + gap);
            doc.rect(bx, boxY, boxW, boxH).fill(light);
            doc.fontSize(8).font('Helvetica').fillColor(gray).text(b.label, bx + 8, boxY + 8, { width: boxW - 16 });
            doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text(b.value, bx + 8, boxY + 24, { width: boxW - 16 });
        });

        // Period  
        let y = 185;
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text('Period Breakdown', 50, y);
        y += 18;

        const cols  = [50, 155, 255, 360, 460];
        const heads = ['Period', 'Orders', 'Revenue', 'Platform', 'Tutor Payout'];
        doc.rect(50, y, 495, 16).fill('#ede9fe');
        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark);
        heads.forEach((h, i) => doc.text(h, cols[i], y + 4, { width: 95 }));
        y += 18;

        doc.fontSize(8).font('Helvetica').fillColor(dark);
        chartData.forEach((row, idx) => {
            if (y > 730) { doc.addPage(); y = 50; }
            if (idx % 2 === 0) doc.rect(50, y - 2, 495, 14).fill('#fafafa');
            doc.fillColor(dark);
            doc.text(row.period,                cols[0], y, { width: 95 });
            doc.text(String(row.orders),        cols[1], y, { width: 95 });
            doc.text(fmt(row.revenue),          cols[2], y, { width: 95 });
            doc.text(fmt(row.platformRevenue),  cols[3], y, { width: 95 });
            doc.text(fmt(row.tutorRevenue),     cols[4], y, { width: 95 });
            y += 14;
        });


        y += 12;
        if (y > 680) { doc.addPage(); y = 50; }
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text('Order Details', 50, y);
        y += 18;

        const oCols  = [50,  145, 215, 340, 395, 455, 510];
        const oWidths= [90,   65, 120,  50,  55,  50,  80];
        const oHeads = ['Order ID', 'Student', 'Course', 'Amount', 'Tutor', 'Date', 'Coupon'];

        doc.rect(50, y, 545, 16).fill('#ede9fe');
        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark);
        oHeads.forEach((h, i) => doc.text(h, oCols[i], y + 4, { width: oWidths[i] }));
        y += 18;

        const ROW_H = 15;
        let rowIdx = 0;
        doc.fontSize(7.5).font('Helvetica').fillColor(dark);

        const trunc = (str, maxChars) =>
            str.length > maxChars ? str.substring(0, maxChars - 1) + '…' : str;

        for (const order of orders) {
            for (const courseItem of order.courses) {
                if (y > 760) { doc.addPage(); y = 50; }
                if (rowIdx % 2 === 0) doc.rect(50, y - 2, 545, ROW_H).fill('#fafafa');
                doc.fillColor(dark);

                const tutorName   = courseItem.tutor?.name || '-';
                const courseTitle = courseItem.courseTitle || '-';
                const date        = new Date(order.orderDate).toLocaleDateString('en-IN');
                const courseAmt   = fmt(courseItem.discountedPrice || 0);

                doc.text(trunc(order.orderId, 17),           oCols[0], y, { width: oWidths[0], lineBreak: false });
                doc.text(trunc(order.user?.name || '-', 12), oCols[1], y, { width: oWidths[1], lineBreak: false });
                doc.text(trunc(courseTitle, 22),             oCols[2], y, { width: oWidths[2], lineBreak: false });
                doc.text(courseAmt,                          oCols[3], y, { width: oWidths[3], lineBreak: false });
                doc.text(trunc(tutorName, 10),               oCols[4], y, { width: oWidths[4], lineBreak: false });
                doc.text(date,                               oCols[5], y, { width: oWidths[5], lineBreak: false });
                doc.text(trunc(order.couponCode || '-', 10), oCols[6], y, { width: oWidths[6], lineBreak: false });
                y += ROW_H;
                rowIdx++;
            }
        }

        doc.fontSize(8).font('Helvetica').fillColor(gray)
            .text('Cognon Learning Platform - Confidential', 50, 800, { align: 'center', width: 495 });

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
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=earnings-report-${Date.now()}.pdf`);
        doc.pipe(res);

        const purple = '#7c3aed';
        const dark   = '#111827';
        const gray   = '#6b7280';
        const light  = '#f5f3ff';

        // Header
        doc.rect(0, 0, 595, 80).fill(purple);
        doc.fontSize(22).font('Helvetica-Bold').fillColor('#ffffff')
            .text('Cognon - Earnings Report', 50, 22);
        doc.fontSize(10).font('Helvetica').fillColor('#e9d5ff')
            .text(`Tutor: ${tutorName}`, 50, 50);

        const dateRange = dateFrom && dateTo
            ? `${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}`
            : 'All Time';
        doc.fontSize(9).fillColor('#e9d5ff').text(`Period: ${dateRange}`, 300, 50);
        doc.fontSize(9).fillColor(gray).text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50, 90);

        // Summary 
        const boxes = [
            { label: 'Your Earnings',    value: fmt(summary.totalEarnings) },
            { label: 'Gross Revenue',    value: fmt(summary.totalGross) },
            { label: 'Platform Fee',     value: fmt(summary.platformFee) },
            { label: 'Total Sales',      value: String(summary.totalEnrollments) },
            { label: 'Razorpay Orders',  value: String(summary.paymentMethods?.razorpay?.count || 0) },
            { label: 'Wallet Orders',    value: String(summary.paymentMethods?.wallet?.count || 0) },
        ];
        const bw = 115, bh = 55, bY = 110, gap = 10;
        boxes.forEach((b, i) => {
            const bx = 50 + i * (bw + gap);
            doc.rect(bx, bY, bw, bh).fill(light);
            doc.fontSize(8).font('Helvetica').fillColor(gray).text(b.label, bx + 8, bY + 8, { width: bw - 16 });
            doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text(b.value, bx + 8, bY + 24, { width: bw - 16 });
        });

        // Course 
        let y = 185;
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text('Earnings by Course', 50, y);
        y += 18;

        const cCols   = [50, 200, 255, 320, 390, 460];
        const cWidths = [145, 50, 60, 65, 65, 70];
        const cHeads  = ['Course', 'Sales', 'Avg Price', 'Gross', 'Your Earnings', 'Category'];

        doc.rect(50, y, 495, 16).fill('#ede9fe');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(dark);
        cHeads.forEach((h, i) => doc.text(h, cCols[i], y + 4, { width: cWidths[i] }));
        y += 18;

        doc.fontSize(7.5).font('Helvetica').fillColor(dark);
        courseBreakdown.forEach((c, idx) => {
            if (y > 730) { doc.addPage(); y = 50; }
            if (idx % 2 === 0) doc.rect(50, y - 2, 495, 14).fill('#fafafa');
            doc.fillColor(dark);
            doc.text(c.courseTitle,          cCols[0], y, { width: cWidths[0] });
            doc.text(String(c.enrollments),  cCols[1], y, { width: cWidths[1] });
            doc.text(fmt(c.avgSalePrice),    cCols[2], y, { width: cWidths[2] });
            doc.text(fmt(c.grossRevenue),    cCols[3], y, { width: cWidths[3] });
            doc.text(fmt(c.earnings),        cCols[4], y, { width: cWidths[4] });
            doc.text(c.courseCategory,       cCols[5], y, { width: cWidths[5] });
            y += 14;
        });

        // Transaction 
        y += 12;
        if (y > 680) { doc.addPage(); y = 50; }
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text('Transaction Details', 50, y);
        y += 18;

        const tCols   = [50, 110, 230, 310, 370, 430, 480];
        const tWidths = [55, 115, 75, 55, 55, 45, 65];
        const tHeads  = ['Date', 'Course', 'Student', 'Sale Price', 'Earnings', 'Coupon'];

        doc.rect(50, y, 495, 16).fill('#ede9fe');
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor(dark);
        ['Date','Course','Student','Sale Price','Earnings','Coupon'].forEach((h, i) =>
            doc.text(h, tCols[i], y + 4, { width: tWidths[i] })
        );
        y += 18;

        let rowIdx = 0;
        doc.fontSize(7).font('Helvetica').fillColor(dark);
        transactions.forEach(t => {
            if (y > 760) { doc.addPage(); y = 50; }
            if (rowIdx % 2 === 0) doc.rect(50, y - 2, 495, 13).fill('#fafafa');
            doc.fillColor(dark);
            doc.text(new Date(t.date).toLocaleDateString('en-IN'), tCols[0], y, { width: tWidths[0] });
            doc.text(t.courseTitle,  tCols[1], y, { width: tWidths[1] });
            doc.text(t.student,      tCols[2], y, { width: tWidths[2] });
            doc.text(fmt(t.salePrice), tCols[3], y, { width: tWidths[3] });
            doc.text(fmt(t.earnings),  tCols[4], y, { width: tWidths[4] });
            doc.text(t.coupon,         tCols[5], y, { width: tWidths[5] });
            y += 13;
            rowIdx++;
        });

        doc.fontSize(8).font('Helvetica').fillColor(gray)
            .text('Cognon Learning Platform - Confidential', 50, 800, { align: 'center', width: 495 });
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



