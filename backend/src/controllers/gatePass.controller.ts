import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import puppeteer from 'puppeteer';

const getGatePassFilters = (req: AuthRequest) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = (req.query.status as string) || '';
  const skip = (page - 1) * limit;
  const where: any = {};

  if (status) where.status = status;

  return { page, limit, skip, where };
};

export const listGatePasses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip, where } = getGatePassFilters(req);
    const user = req.user!;

    if (user.role === 'STUDENT') {
      const student = await prisma.student.findFirst({ where: { userId: user.id } });
      where.studentId = student?.id;
    } else if (user.role === 'TEACHER') {
      where.requesterId = user.id;
    }

    const [items, total] = await Promise.all([
      prisma.gatePass.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
          student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
          approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        },
      }),
      prisma.gatePass.count({ where }),
    ]);

    paginatedResponse(res, items, total, page, limit, 'Gate passes fetched');
  } catch (error) {
    next(error);
  }
};

export const createGatePass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user!;
    const { reason, destination, exitTime, returnTime, notes, requestType, studentId } = req.body;

    const studentRecord = studentId ? await prisma.student.findUnique({ where: { id: studentId } }) : null;
    if (studentId && !studentRecord) return next(createError('Student not found', 404));

    const slipNumber = `GP-${Date.now().toString().slice(-6)}`;

    const gatePass = await prisma.gatePass.create({
      data: {
        requesterId: user.id,
        studentId: studentRecord?.id || null,
        requestType: requestType || (user.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'),
        reason,
        destination,
        exitTime,
        returnTime,
        notes,
        slipNumber,
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
      },
    });

    successResponse(res, gatePass, 'Gate pass requested successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const updateGatePass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    const user = req.user!;

    const gatePass = await prisma.gatePass.findUnique({ where: { id } });
    if (!gatePass) return next(createError('Gate pass not found', 404));

    const updated = await prisma.gatePass.update({
      where: { id },
      data: {
        status,
        approvedById: user.id,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
    });

    successResponse(res, updated, 'Gate pass updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getGatePassById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
    });

    if (!gatePass) return next(createError('Gate pass not found', 404));
    successResponse(res, gatePass, 'Gate pass fetched');
  } catch (error) {
    next(error);
  }
};

export const printGatePass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
    });

    if (!gatePass) return next(createError('Gate pass not found', 404));

    // Allow only admins or the requester/student owner to view/print
    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isOwner = gatePass.requesterId === user.id || gatePass.student?.user?.id === user.id;
    if (!isAdmin && !isOwner) return next(createError('Forbidden', 403));

    const data = {
      slipNumber: gatePass.slipNumber || '',
      status: gatePass.status || '',
      requesterName: gatePass.requester?.name || '',
      studentName: gatePass.student?.user?.name || '',
      studentClass: gatePass.student?.class ? `${gatePass.student.class.name} ${gatePass.student.class.section}` : '',
      destination: gatePass.destination || '',
      reason: gatePass.reason || '',
      exitTime: gatePass.exitTime || '',
      returnTime: gatePass.returnTime || '',
      notes: gatePass.notes || '',
      photoUrl: gatePass.student?.user?.photoUrl || gatePass.requester?.photoUrl || '',
      approvedBy: gatePass.approvedBy?.name || 'Pending',
      requestedDate: gatePass.createdAt ? gatePass.createdAt.toISOString().slice(0, 10) : '',
    };

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gate Pass - ${data.slipNumber}</title>
  <style>
    body{font-family: Arial, Helvetica, sans-serif; color:#222}
    .container{max-width:800px;margin:20px auto;border:1px solid #ccc;padding:16px}
    .header{display:flex;justify-content:space-between;align-items:center}
    .visitor{background:#177f3a;color:#fff;padding:6px 10px;font-weight:700}
    .logo{font-size:24px;font-weight:700}
    .details{display:flex;gap:16px;margin-top:12px}
    .left{flex:1}
    .right{width:140px;text-align:center}
    .field{margin-bottom:6px}
    .label{font-size:12px;color:#666}
    .value{font-weight:700}
    .photo{width:120px;height:140px;object-fit:cover;border:1px solid #ddd}
    .signs{display:flex;justify-content:space-between;margin-top:22px}
    .sign{width:30%;text-align:center}
    .small{font-size:12px;color:#666}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="visitor">VISITOR</div>
      <div class="logo">LOGO</div>
    </div>
    <div class="details">
      <div class="left">
        <div class="field"><div class="label">Name</div><div class="value">${data.studentName || data.requesterName}</div></div>
        <div class="field"><div class="label">From</div><div class="value">${data.requesterName}</div></div>
        <div class="field"><div class="label">To Meet</div><div class="value">${data.destination}</div></div>
        <div class="field"><div class="label">Purpose</div><div class="value">${data.reason}</div></div>
        <div class="field"><div class="label">Time In</div><div class="value">${data.exitTime}</div></div>
        <div class="field"><div class="label">Validity</div><div class="value">${data.requestedDate} ${data.returnTime ? ' - ' + data.returnTime : ''}</div></div>
      </div>
      <div class="right">
        ${data.photoUrl ? `<img src="${data.photoUrl}" class="photo" alt="photo"/>` : `<div style="width:120px;height:140px;border:1px solid #eee;display:flex;align-items:center;justify-content:center;color:#999">No Photo</div>`}
        <div style="margin-top:8px">Sr.No: ${data.slipNumber}</div>
      </div>
    </div>
    <div class="signs">
      <div class="sign"><div class="small">VISITOR SIGN</div><div style="height:40px"></div></div>
      <div class="sign"><div class="small">EMPLOYEE SIGN</div><div style="height:40px"></div></div>
      <div class="sign"><div class="small">SECURITY OFFICER</div><div style="height:40px"></div></div>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); };</script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    next(error);
  }
};

export const printGatePassPdf = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const gatePass = await prisma.gatePass.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
        student: { include: { user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } }, class: true } },
        approvedBy: { select: { id: true, name: true, email: true, role: true, photoUrl: true } },
      },
    });

    if (!gatePass) return next(createError('Gate pass not found', 404));

    const isAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const isOwner = gatePass.requesterId === user.id || gatePass.student?.user?.id === user.id;
    if (!isAdmin && !isOwner) return next(createError('Forbidden', 403));

    const data = {
      slipNumber: gatePass.slipNumber || '',
      status: gatePass.status || '',
      requesterName: gatePass.requester?.name || '',
      studentName: gatePass.student?.user?.name || '',
      studentClass: gatePass.student?.class ? `${gatePass.student.class.name} ${gatePass.student.class.section}` : '',
      destination: gatePass.destination || '',
      reason: gatePass.reason || '',
      exitTime: gatePass.exitTime || '',
      returnTime: gatePass.returnTime || '',
      notes: gatePass.notes || '',
      photoUrl: gatePass.student?.user?.photoUrl || gatePass.requester?.photoUrl || '',
      approvedBy: gatePass.approvedBy?.name || 'Pending',
      requestedDate: gatePass.createdAt ? gatePass.createdAt.toISOString().slice(0, 10) : '',
    };

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Gate Pass - ${data.slipNumber}</title>
  <style>
    body{font-family: Arial, Helvetica, sans-serif; color:#222}
    .container{max-width:800px;margin:20px auto;border:1px solid #ccc;padding:16px}
    .header{display:flex;justify-content:space-between;align-items:center}
    .visitor{background:#177f3a;color:#fff;padding:6px 10px;font-weight:700}
    .logo{font-size:24px;font-weight:700}
    .details{display:flex;gap:16px;margin-top:12px}
    .left{flex:1}
    .right{width:140px;text-align:center}
    .field{margin-bottom:6px}
    .label{font-size:12px;color:#666}
    .value{font-weight:700}
    .photo{width:120px;height:140px;object-fit:cover;border:1px solid #ddd}
    .signs{display:flex;justify-content:space-between;margin-top:22px}
    .sign{width:30%;text-align:center}
    .small{font-size:12px;color:#666}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="visitor">VISITOR</div>
      <div class="logo">LOGO</div>
    </div>
    <div class="details">
      <div class="left">
        <div class="field"><div class="label">Name</div><div class="value">${data.studentName || data.requesterName}</div></div>
        <div class="field"><div class="label">From</div><div class="value">${data.requesterName}</div></div>
        <div class="field"><div class="label">To Meet</div><div class="value">${data.destination}</div></div>
        <div class="field"><div class="label">Purpose</div><div class="value">${data.reason}</div></div>
        <div class="field"><div class="label">Time In</div><div class="value">${data.exitTime}</div></div>
        <div class="field"><div class="label">Validity</div><div class="value">${data.requestedDate} ${data.returnTime ? ' - ' + data.returnTime : ''}</div></div>
      </div>
      <div class="right">
        ${data.photoUrl ? `<img src="${data.photoUrl}" class="photo" alt="photo"/>` : `<div style="width:120px;height:140px;border:1px solid #eee;display:flex;align-items:center;justify-content:center;color:#999">No Photo</div>`}
        <div style="margin-top:8px">Sr.No: ${data.slipNumber}</div>
      </div>
    </div>
    <div class="signs">
      <div class="sign"><div class="small">VISITOR SIGN</div><div style="height:40px"></div></div>
      <div class="sign"><div class="small">EMPLOYEE SIGN</div><div style="height:40px"></div></div>
      <div class="sign"><div class="small">SECURITY OFFICER</div><div style="height:40px"></div></div>
    </div>
  </div>
</body>
</html>`;

    // Generate PDF with Puppeteer
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' } });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="gatepass-${data.slipNumber || id}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
