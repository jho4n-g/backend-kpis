export async function archivarGestionActiva() {
  return sequelize.transaction(async (t) => {
    const activa = await Gestion.findOne({
      where: { is_archived: false },
      order: [['startYear', 'DESC']],
      transaction: t,
    });
    if (activa) {
      await activa.update({ is_archived: true }, { transaction: t });
    }
  });
}
