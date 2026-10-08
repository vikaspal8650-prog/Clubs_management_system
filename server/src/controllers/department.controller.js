const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const view = (department) => ({
  ...department,
  hodName: department.hod?.name || '',
  hodEmail: department.hod?.email || '',
  hod: undefined,
});

const getDepartments = async (_req, res) => {
  try {
    const departments = await prisma.department.findMany({ include: { hod: { select: { id: true, name: true, email: true } } }, orderBy: { name: 'asc' } });
    res.json(departments.map(view));
  } catch (err) { res.status(500).json({ error: 'Failed to fetch departments', details: err.message }); }
};

const resolveHod = async (hodId, hodEmail) => {
  if (hodId) return prisma.user.findFirst({ where: { id: hodId, role: 'HOD' } });
  if (hodEmail?.trim()) return prisma.user.findFirst({ where: { email: { equals: hodEmail.trim().toLowerCase(), mode: 'insensitive' }, role: 'HOD' } });
  return null;
};

const saveDepartment = async (req, res) => {
  try {
    const { name, code, description, status, hodId, hodEmail } = req.body;
    if (!name?.trim() || !code?.trim()) return res.status(400).json({ error: 'Department name and code are required.' });
    const hod = await resolveHod(hodId, hodEmail);
    if ((hodId || hodEmail?.trim()) && !hod) return res.status(400).json({ error: 'The selected HOD account was not found.' });
    const data = { name: name.trim(), code: code.trim().toUpperCase(), description: description?.trim() || null, status: status || 'ACTIVE', hodId: hod?.id || null };
    const department = req.params.id
      ? await prisma.department.update({ where: { id: req.params.id }, data, include: { hod: { select: { id: true, name: true, email: true } } } })
      : await prisma.department.create({ data, include: { hod: { select: { id: true, name: true, email: true } } } });
    res.status(req.params.id ? 200 : 201).json(view(department));
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Department name, code, or HOD assignment already exists.' });
    res.status(500).json({ error: 'Failed to save department', details: err.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await prisma.department.findUnique({ where: { id: req.params.id }, include: { _count: { select: { clubs: true } } } });
    if (!department) return res.status(404).json({ error: 'Department not found.' });
    // This only removes the directory record; nullable foreign keys are safely detached.
    await prisma.department.delete({ where: { id: department.id } });
    res.json({ message: 'Department deleted successfully.' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete department', details: err.message }); }
};
module.exports = { getDepartments, saveDepartment, deleteDepartment };
