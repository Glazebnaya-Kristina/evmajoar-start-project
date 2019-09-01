'use strict';

const { series, parallel, src, dest, watch, lastRun } = require( 'gulp' );
const pug = require( 'gulp-pug' );
const scss = require( 'gulp-sass' );
const autoprefixer = require( 'gulp-autoprefixer' );
const csso = require( 'gulp-csso' );
const imagemin = require( 'gulp-imagemin' );
const imageminMozjpeg = require( 'imagemin-mozjpeg' );
const webp = require( 'imagemin-webp' );
const svgstore = require('gulp-svgstore');
const svgmin = require( 'gulp-svgmin' );
const ttf2woff = require( 'gulp-ttf2woff' );
const ttf2woff2 = require( 'gulp-ttf2woff2' );
const plumber = require( 'gulp-plumber' );
const notify = require( 'gulp-notify' );
const debug = require( 'gulp-debug' );
const rename = require( 'gulp-rename' );
const uglify = require( 'gulp-uglify' );
const concat = require( 'gulp-concat' );
const del = require( 'del' );
const browserSync = require( 'browser-sync' ).create();


// Корневые папки
const root = {
  src: 'src/',
  build: 'build/'
};


// Папки сборки
const path = {
  build: {
    html: root.build,
    css: root.build + 'styles/',
    js: root.build + 'scripts/',
    font: root.build + 'fonts/',
    img: root.build + 'images/',
    ico: root.build + 'icons/',
    videos: root.build + 'videos/',
  }
};


// Очистка дериктории сборки
function clearBuildDir() {
  return del(['build']);
}
exports.clearBuildDir = clearBuildDir;


// Компиляция PUG
function compilePug() {
  return src( `${root.src}pages/**/*.pug` )
    .pipe( plumber( {
      errorHandler: notify.onError( {
        title: "Ошибка в HTML",
        message: "Error: <%= error.message %>"
      } )
    } ) )
    .pipe( pug({pretty: true} ) )
    .pipe( debug({title: 'Compiles'} ) )
    .pipe( rename({dirname: ''} ) )
    .pipe( dest( path.build.html ) )
    .pipe( browserSync.stream() );
}
exports.compilePug = compilePug;


// Компиляция SCSS
function compileScss() {
  return src( `${root.src}pages/**/*.scss` )
    .pipe( plumber( {
      errorHandler: notify.onError( {
        title: "Ошибка в SCSS",
        message: "Error: <%= error.message %>"
      } )
    } ) )
    .pipe( scss() )
    .pipe( debug({title: 'Compiles:'} ) )
    .pipe( autoprefixer({cascade: false} ) )
    .pipe( csso({comments: false, restructure: false} ) )
    .pipe( rename({dirname: '', suffix: '.min'} ) )
    .pipe( dest( path.build.css ) )
    .pipe( browserSync.stream() );
}
exports.compileScss = compileScss;


// Сборка JS
function buildJs() {
  return src( `${root.src}blocks/**/*.js` )
    .pipe( plumber( {
      errorHandler: notify.onError( {
        title: "Ошибка в JS",
        message: "Error: <%= error.message %>"
      } )
    } ) )
    .pipe( concat('script.js') )
    .pipe( uglify() )
    .pipe( debug({title: 'Compiles'} ) )
    .pipe( rename({suffix: '.min'} ) )
    .pipe( dest( path.build.js ) )
    .pipe( browserSync.stream() );
}
exports.buildJs = buildJs;


// Конвертация шрифтов
function convertTTFtoWOFF() {
  return src( `${root.src}theme/fonts/**/*.ttf` )
    .pipe( ttf2woff() )
    .pipe( dest(path.build.font) )
    .pipe( browserSync.stream() );
}
exports.convertTTFtoWOFF = convertTTFtoWOFF;

function convertTTFtoWOFF2() {
  return src( `${root.src}theme/fonts/**/*.ttf` )
    .pipe( ttf2woff2() )
    .pipe( dest( path.build.font ) )
    .pipe( browserSync.stream() );
}
exports.convertTTFtoWOFF2 = convertTTFtoWOFF2;


// Оптимизация PNG, JPG
function optimizeImages() {
  return src( `${root.src}theme/images/*.{jpg,png}` )
    .pipe( imagemin([
      imagemin.optipng(),
      imageminMozjpeg({quality: 75} )
    ] ) )
    .pipe( rename({dirname: ''} ) )
    .pipe( dest( path.build.img ) )
    .pipe( browserSync.stream() );
}
exports.optimizeImages = optimizeImages;


// Оптимизация SVG
function optimizeSvg() {
  return src( `${root.src}theme/images/*.svg` )
    .pipe( imagemin([
      imagemin.svgo( {
        plugins: [
          {removeViewBox: false},
          {removeTitle: true},
          {cleanupNumericValues: {floatPrecision: 0}}
        ]
      } )
    ] ) )
    .pipe( rename({dirname: ''} ) )
    .pipe( dest( path.build.img ) )
    .pipe( browserSync.stream() );
}
exports.optimizeSvg = optimizeSvg;


// Конвертация изображений в WebP
function convertImagesToWebp() {
  return src( `${root.src}theme/images/*.{jpg,png,svg}` )
    .pipe( imagemin([webp({quality: 75} )] ) )
    .pipe( rename({extname: '.webp'} ) )
    .pipe( rename({dirname: ''} ) )
    .pipe( dest( path.build.img ) )
    .pipe( browserSync.stream() );
}
exports.convertImagesToWebp = convertImagesToWebp;


// Генерация SVG-спрайта
function generateSvgSprite() {
  return src( `${root.src}theme/sprites/svg/*.svg` )
    .pipe(svgmin(function () {
      return { plugins: [{ cleanupIDs: { minify: true } }] }
    }))
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename('sprite.svg'))
    .pipe( dest( path.build.ico ) )
    .pipe( browserSync.stream() );
}
exports.generateSvgSprite = generateSvgSprite;


// Копирование видео
function copyVideos() {
  return src( `${root.src}theme/videos/**/*.mp4` )
      .pipe( dest( path.build.ico ) )
      .pipe( browserSync.stream() );
}
exports.copyVideos = copyVideos;


// Перезагрузка браузера
function reload(done) {
  browserSync.reload();
  done();
}


// Запуск сервера и отслеживание изменений
function serve() {
  browserSync.init( {
    server: root.build,
    cors: true,
    notify: false,
    port: 8080,
    startPath: 'index.html',
    open: false
  } );


  // Разметка
  watch(
    [
      `${root.src}blocks/**/*.pug`,
      `${root.src}sections/**/*.pug`,
      `${root.src}layouts/*.pug`,
      `${root.src}pages/**/*.pug`
    ],
    { events: ['all'], delay: 100 },
    series( compilePug, reload )
  );


  // Стили
  watch(
    [
      `${root.src}libraries/**/**/*.scss`,
      `${root.src}blocks/**/*.scss`,
      `${root.src}sections/**/*.scss`,
      `${root.src}layouts/**/*.scss`,
      `${root.src}pages/**/*.scss`
    ],
    { events: ['all'], delay: 100 },
    series( compileScss, reload )
  );


  // Скрипты
  watch(
    [ `${root.src}blocks/**/*.js` ],
    { events: ['all'], delay: 100 },
    series( buildJs, reload )
  );


  // Шрифты
  watch(
    [ `${root.src}theme/fonts/**/*.ttf` ],
    { events: ['all'], delay: 100 },
    series( convertTTFtoWOFF, convertTTFtoWOFF2 )
  );


  // Изображения
  watch(
    [ `${root.src}theme/images/*.{jpg,jpeg,png,gif,svg}` ],
    { events: ['all'], delay: 100 },
    series( optimizeImages, optimizeSvg, convertImagesToWebp, reload )
  );


  // SVG-спрайт
  watch(
    [ `${root.src}theme/sprites/svg/*.svg` ],
    { events: ['all'], delay: 100 },
    series( generateSvgSprite, reload )
  );


  // Видео
  watch(
      [ `${root.src}theme/videos/**/*.mp4` ],
      { events: ['all'], delay: 100 },
      series( copyVideos, reload )
  );
}


exports.build = series(
    parallel(clearBuildDir),
    parallel(optimizeImages, optimizeSvg, convertImagesToWebp, generateSvgSprite, copyVideos),
    parallel(convertTTFtoWOFF, convertTTFtoWOFF2),
    parallel(compilePug, compileScss, buildJs),
);

exports.default = series(
    parallel(clearBuildDir),
    parallel(optimizeImages, optimizeSvg, convertImagesToWebp, generateSvgSprite, copyVideos),
    parallel(convertTTFtoWOFF, convertTTFtoWOFF2),
    parallel(compilePug, compileScss, buildJs),
    serve,
);