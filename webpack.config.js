module.exports = {
  entry: {
    app: ['./index.js']
  },

  output: {
    path      : './build',
    filename  : 'bundle.js',
    publicPath: '/'
  },

  module: {
    preLoaders : [],
    loaders    : [],
    postLoaders: []
  },

  devtool: '#source-map',

  devServer: {
    host       : process.env.HOST,
    port       : process.env.PORT,
    contentBase: './public',
    open       : true,
    progress   : true,
    watch      : true,
    debug      : true
  }
};
