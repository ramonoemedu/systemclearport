module.exports = function override(config, env) {
  // Disable source maps to reduce memory usage
  config.devtool = false;
  
  // Increase performance limits
  config.performance = {
    maxAssetSize: 512000,
    maxEntrypointSize: 512000,
    hints: false
  };
  
  // Find and configure ForkTsCheckerWebpackPlugin
  const ForkTsCheckerWebpackPlugin = config.plugins.find(
    plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
  );
  
  if (ForkTsCheckerWebpackPlugin) {
    // Increase memory limit for TypeScript checker
    ForkTsCheckerWebpackPlugin.options.memoryLimit = 8192;
    // Make it less strict to avoid crashes
    ForkTsCheckerWebpackPlugin.options.async = true;
  }
  
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
