const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Order = require('../models/Order');
const Course = require('../models/Course');

const fmt = (n) => `Rs.${Math.round(n).toLocaleString('en-IN')}`;

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

        // Title bar
        doc.rect(0, 0, 595, 80).fill(purple);
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#ffffff').text('Cognon - Sales Report', 50, 25);

        const dateRange = dateFrom && dateTo
            ? `${new Date(dateFrom).toLocaleDateString('en-IN')} to ${new Date(dateTo).toLocaleDateString('en-IN')}`
            : 'All Time';
        doc.fontSize(10).font('Helvetica').fillColor('#e9d5ff').text(`Period: ${dateRange}`, 50, 55);
        doc.fontSize(9).fillColor(gray).text(`Generated: ${new Date().toLocaleString('en-IN')}`, 50, 90);

        // Summary boxes
        const boxes = [
            { label: 'Total Revenue',    value: fmt(summary.totalRevenue) },
            { label: 'Tutor Payouts',    value: fmt(summary.totalTutorRevenue) },
            { label: 'Platform Revenue', value: fmt(summary.totalPlatformRevenue) },
            { label: 'Total Orders',     value: String(summary.totalOrders) },
        ];
        const boxW = 115, boxH = 55, boxY = 110, gap = 10;
        boxes.forEach((b, i) => {
            const bx = 50 + i * (boxW + gap);
            doc.rect(bx, boxY, boxW, boxH).fill(light);
            doc.fontSize(8).font('Helvetica').fillColor(gray).text(b.label, bx + 8, boxY + 8, { width: boxW - 16 });
            doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text(b.value, bx + 8, boxY + 24, { width: boxW - 16 });
        });

        // Period Breakdown table
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

        // Order Details table
        y += 12;
        if (y > 680) { doc.addPage(); y = 50; }
        doc.fontSize(12).font('Helvetica-Bold').fillColor(dark).text('Order Details', 50, y);
        y += 18;

        const oCols  = [50, 145, 255, 355, 435, 500];
        const oHeads = ['Order ID', 'Student', 'Date', 'Amount', 'Coupon', 'Status'];
        doc.rect(50, y, 495, 16).fill('#ede9fe');
        doc.fontSize(8).font('Helvetica-Bold').fillColor(dark);
        oHeads.forEach((h, i) => doc.text(h, oCols[i], y + 4, { width: 90 }));
        y += 18;

        doc.fontSize(7.5).font('Helvetica').fillColor(dark);
        orders.forEach((order, idx) => {
            if (y > 750) { doc.addPage(); y = 50; }
            if (idx % 2 === 0) doc.rect(50, y - 2, 495, 13).fill('#fafafa');
            doc.fillColor(dark);
            doc.text(order.orderId,                                         oCols[0], y, { width: 90 });
            doc.text(order.user?.name || '-',                               oCols[1], y, { width: 105 });
            doc.text(new Date(order.orderDate).toLocaleDateString('en-IN'), oCols[2], y, { width: 95 });
            doc.text(fmt(order.finalAmount),                                oCols[3], y, { width: 75 });
            doc.text(order.couponCode || '-',                               oCols[4], y, { width: 60 });
            doc.text(order.paymentStatus,                                   oCols[5], y, { width: 60 });
            y += 13;
        });

        // Footer
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

        // Orders Sheet
        const ordersSheet = workbook.addWorksheet('Orders');
        ordersSheet.columns = [
            { header: 'Order ID',           key: 'orderId',       width: 24 },
            { header: 'Student Name',       key: 'studentName',   width: 22 },
            { header: 'Student Email',      key: 'studentEmail',  width: 30 },
            { header: 'Date',               key: 'date',          width: 15 },
            { header: 'Subtotal (Rs.)',     key: 'subtotal',      width: 16 },
            { header: 'Discount (Rs.)',     key: 'discount',      width: 16 },
            { header: 'Final Amount (Rs.)', key: 'finalAmount',   width: 18 },
            { header: 'Coupon Code',        key: 'coupon',        width: 15 },
            { header: 'Payment Status',     key: 'paymentStatus', width: 18 },
            { header: 'Courses',            key: 'courses',       width: 45 },
        ];
        ordersSheet.getRow(1).font = headerFont;
        ordersSheet.getRow(1).fill = purpleFill;

        for (const order of orders) {
            ordersSheet.addRow({
                orderId:       order.orderId,
                studentName:   order.user?.name  || '-',
                studentEmail:  order.user?.email || '-',
                date:          new Date(order.orderDate).toLocaleDateString('en-IN'),
                subtotal:      order.subtotal   || 0,
                discount:      order.discount   || 0,
                finalAmount:   order.finalAmount,
                coupon:        order.couponCode || '-',
                paymentStatus: order.paymentStatus,
                courses:       order.courses.map(c => c.courseTitle || c.course?.title || '-').join(', '),
            });
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

    async getTutorSalesReport(tutorId, { dateFrom, dateTo, period = 'monthly' } = {} ){
        const query = {
            'courses.tutor': tutorId,
            paymentStatus: 'completed',
        }

        if( dateFrom || dateTo ){
            query.orderDate = {};
            if(dateFrom) query.orderDate.$gte = new Date(dateFrom);
            if(dateTo){
                const end = new Date(dateTo);
                end.setHours(23,59,59,999);
                query.orderDate.$lte = end;
            }
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate('courses.course', ' title category')
            .populate('couponApplied', 'code')
            .sort({ orderDate: -1 });

        
            
    }
};

module.exports = salesReportService;
