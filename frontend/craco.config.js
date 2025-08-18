const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // 빌드 성능 최적화
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };

      // 메모리 사용량 최적화
      webpackConfig.performance = {
        maxAssetSize: 512000,
        maxEntrypointSize: 512000,
        hints: false
      };

      // 프로덕션 빌드 최적화
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.optimization.minimize = true;
        webpackConfig.devtool = false;
      }

      return webpackConfig;
    }
  }
};
