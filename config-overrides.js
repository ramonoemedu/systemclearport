module.exports = function override(config, env) {
  // Disable source maps to reduce memory usage
  config.devtool = false;
  
  // Increase performance limits
  config.performance = {
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
    hints: false
  };
  
  // Remove ForkTsCheckerWebpackPlugin to avoid memory issues
  config.plugins = config.plugins.filter(
    plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
  );
  
  // Optimize chunks
  if (config.optimization) {
    config.optimization.splitChunks = {
      cacheGroups: {
        default: false,
        vendors: false,
        vendor: {
          name: 'vendor',
          chunks: 'all',
          test: /node_modules/,
          priority: 20
        },
        tesseract: {
          name: 'tesseract',
          test: /[\\/]node_modules[\\/](tesseract\.js)[\\/]/,
          chunks: 'all',
          priority: 30,
          reuseExistingChunk: true
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true
        }
      }
    };
  }
  
  return config;
};
