/** ===== var ===== **/
// gulp
const gulp = require('gulp')

// Pug
const gulpPug = require('gulp-pug')
const fs = require('fs')

// Sass
const gulpSass = require('gulp-sass')(require('sass'))
const sassGlob = require('gulp-sass-glob-use-forward')
const postcss = require('gulp-postcss')
const postcssSyntax = require('postcss-scss')
const autoprefixer = require('autoprefixer')
const cmq = require('postcss-combine-media-query')
const stylelint = require('stylelint')

// Local server
const browserSync = require('browser-sync')
const browserSyncSsi = require('browsersync-ssi')

// webpack
const webpackStream = require('webpack-stream')
const webpack = require('webpack')
const webpackConfig = require('./webpack.config') // webpackの設定ファイルの読み込み
const named = require('vinyl-named')
// Utility
const plumber = require('gulp-plumber')
const notify = require('gulp-notify')

// 公開用ディレクトリ
const dest = 'public/'
const root = 'public/'

// 開発用ディレクトリ
const src = {
  data: 'src/_data/site.json',
  pug: {
    dir: 'src/pug/',
    file: 'src/pug/**/!(_)*.pug',
    watch: ['src/pug/**/(_)*.pug', 'src/_data/**/*.json'],
  },
  sass: {
    dir: 'src/scss',
    file: 'src/scss/**/!(_)*.scss',
    watch: 'src/**/*.scss',
  },
  js: {
    file: 'src/js/**/!(_)*.js',
    watch: 'src/**/*.js',
  },
  img: {
    file: 'src/img/**/*.{png,jpg,gif,svg,ico}',
    watch: 'src/img/**/*',
  },
  public: {
    file: 'src/public/**/*',
  },
}

/** ===== task ===== **/
/**
 * Reload
 */
const reload = (done) => {
  browserSync.reload()
  done()
}
exports.reload = reload

/**
 * Pug
 * .pug -> .html
 */
const pugFunc = (isAll) => {
  // metaデータ等JSONファイルの読み込み。
  const lastRun = isAll ? null : gulp.lastRun(pugFunc)
  const data = {
    site: JSON.parse(fs.readFileSync(src.data)),
  }
  return (
    gulp
      .src(src.pug.file, { since: lastRun })
      // .src(src.pug.file, { since: gulp.lastRun(pug) })
      .pipe(
        plumber({ errorHandler: notify.onError('Error: <%= error.message %>') })
      )
      .pipe(
        gulpPug({
          // dataを各Pugファイルで取得
          data,
          // ルート相対パスでincludeが使えるようにする
          basedir: src.pug.dir,
          // Pugファイルの整形
          pretty: true,
        })
      )
      .pipe(gulp.dest(root))
  )
}

// 差分build
const pug = () => {
  return pugFunc()
}
const html = gulp.series(pug, reload)

// 全build
const pugAll = () => {
  console.log('Build all pug file...')
  return pugFunc(true)
}
const htmlAll = gulp.series(pugAll, reload)

/**
 * Sass
 * .scss -> .css
 */
function sass() {
  const lintPlugins = [stylelint()]
  return gulp
    .src(src.sass.file)
    .pipe(
      plumber({ errorHandler: notify.onError('Error: <%= error.message %>') })
    )
    .pipe(
      postcss(lintPlugins, {
        syntax: postcssSyntax,
      })
    )
    .pipe(sassGlob())
    .pipe(
      gulpSass({
        outputStyle: 'expanded', // expanded or compressed
        includePaths: [src.sass.dir],
      }).on('error', gulpSass.logError)
    )
    .pipe(postcss([cmq(), autoprefixer()]))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }))
}
exports.sass = sass

/**
 * JS
 * ES6をWebpackでbundle
 * .ts → .js
 */
function js() {
  return gulp
    .src(src.js.file)
    .pipe(
      named((file) => {
        return file.relative.replace(/\.[^\.]+$/, '')
      })
    )
    .pipe(webpackStream(webpackConfig, webpack))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }))
}
exports.js = js

/**
 * Image Optimizer
 */
async function image() {
  const imagemin = (await import('gulp-imagemin')).default;
  const imageminMozjpeg = (await import('imagemin-mozjpeg')).default;
  const imageminPngquant = (await import('imagemin-pngquant')).default;
  const imageminOptipng = (await import('imagemin-optipng')).default;
  const imageminGifSicle = (await import('imagemin-gifsicle')).default;
  const imageminSvgo = (await import('imagemin-svgo')).default;
  const gulpWebp = (await import('gulp-webp')).default;
  const changed = (await import('gulp-changed')).default;

  return gulp
    .src(src.img.file)
    .pipe(changed(dest))
    .pipe(
      plumber({
        errorHandler(err) {
          console.log(err.messageFormatted)
          this.emit('end')
        },
      })
    )
    .pipe(
      imagemin([
        imageminMozjpeg({
          // 画質
          quality: 70,
        }),
        imageminPngquant({
          // 画質
          quality: [0.7, 0.8],
        }),
        imageminSvgo({
          plugins: [
            // viewBox属性が無いと表示崩れの原因になるので削除しない
            { name: 'removeViewBox', active: false },
            // metadataは意図的に入れる場合があるので削除しない
            { name: 'removeMetadata', active: false },
            // 追加した要素を削除しない
            { name: 'removeUnknownsAndDefaults', active: false },
            // 勝手に<path>へ変換しない
            { name: 'convertShapeToPath', active: false },
            // <g>タグを削除するとアニメーションが動作しない可能性があるので変換しない
            { name: 'collapseGroups', active: false },
            // id属性はJSに使う場合があるとなることがあるため削除しない。
            { name: 'cleanupIDs', active: false },
          ],
        }),
        imageminOptipng(),
        imageminGifSicle(),
      ])
    )
    .pipe(gulpWebp())
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }))
}
exports.image = image

/**
 * avif Converter
 */
async function avif() {
  const imagemin = (await import('gulp-imagemin')).default;
  const imageminAvif = (await import('imagemin-avif')).default;
  const rename = (await import('gulp-rename')).default;

  return gulp
    .src(src.img.file)
    .pipe(
      imagemin([
        imageminAvif({ quality: 50 })
      ])
    )
    .pipe(rename({ extname: '.avif' }))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.reload({ stream: true }))
}
exports.avif = avif

/**
 * Copy
 * 変換不要でpublicにコピーしたいもの
 * src/public/ → public/
 */
function copy() {
  return gulp.src(src.public.file).pipe(gulp.dest(dest))
}
exports.copy = copy

/**
 * Local server
 */
function serve(done) {
  browserSync({
    server: {
      // SSIを使用
      middleware: [
        browserSyncSsi({
          baseDir: root,
          ext: '.html',
        }),
      ],
      baseDir: root,
    },
    // 他の画面でクリックをミラーリングしない
    ghostMode: false,
    // ローカルIPアドレスで起動する
    open: 'external',
    // サーバー起動時に表示するページ
    startPath: '/',
    // サーバー起動時の通知は不要
    notify: false,
  })
  done()
}
exports.serve = serve

/**
 * Watch
 */
function watch() {
  gulp.watch(src.pug.file, html)
  gulp.watch(src.pug.watch, htmlAll)
  gulp.watch(src.sass.watch, sass)
  gulp.watch(src.js.watch, js)
  gulp.watch(src.img.watch, gulp.parallel(image, avif))
  gulp.watch(src.public.file, copy)
}
exports.watch = watch

/**
 * default
 */
exports.default = gulp.series(
  pug,
  sass,
  serve,
  gulp.parallel(js, image, avif, copy),
  watch
)

/**
 * build
 */
exports.build = gulp.series(pug, sass, gulp.parallel(js, image, avif, copy))
