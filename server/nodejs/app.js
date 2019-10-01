const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
// const bodyParser = require('body-parser');

// set router files
const indexRouter = require('./routes/index');
const cvRouter = require('./routes/cv.route');
const hanaRouter = require('./routes/hana.route');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ limit: '10MB', extended: true }));
app.use(express.json({ limit: '10MB' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// set routes based on previous routers set
app.use('/', indexRouter);
app.use('/api/cv', cvRouter);
app.use('/api/hana', hanaRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
