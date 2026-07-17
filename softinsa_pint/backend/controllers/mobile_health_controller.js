module.exports = {
  health(req, res) {
    return res.status(200).json({
      success: true,
      service: 'mobile-api',
      status: 'ok'
    });
  }
};
