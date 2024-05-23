// const Dotenv = require('dotenv-webpack');
module.exports = {
  // モード値を production に設定すると最適化された状態で、
  // development に設定するとソースマップ有効でJSファイルが出力される
  // mode: "production",
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['url-loader']
      }
      // ... 他のルール ...
    ]
  },
  // plugins: [
  //   new Dotenv()
  // ],

  output: {
    filename: '[name].js',
  },
}
