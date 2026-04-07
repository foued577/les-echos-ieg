const isAdmin = (req, res, next) => {
  // Vérifier si l'utilisateur est authentifié
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Non authentifié'
    });
  }

  // Vérifier si l'utilisateur a le rôle ADMIN
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Droits administratifs requis'
    });
  }

  // Si tout est bon, passer au middleware suivant
  next();
};

module.exports = isAdmin;
