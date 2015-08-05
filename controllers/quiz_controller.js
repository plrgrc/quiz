var models = require('../models/models.js');

// Autoload - PARAM Se carga lo primero si llega el parametro quizId

exports.load = function(req, res, next, quizId) {
  models.Quiz.find({
    where: {
      id: Number(quizId)
    },
    include: [{
      model: models.Comment
    }]
  }).then(function(quiz) {
    if (quiz) {
      req.quiz=quiz;
      next();
    } else { next(new Error('No existe quizId=' + quizId)); }
  }
  ).catch(function(error) { next(error);});
};

// GET /quizes

exports.index = function(req, res) {
  if (req.query.search) {
    var search_like = '%' + req.query.search.replace('/[ ]+/g','%') + '%';

    models.Quiz.findAll({where: ["pregunta like ?", search_like],
       order: [['pregunta','ASC']] })
    .then(function(quizes) {
        res.render('quizes/index', {quizes: quizes, errors: []});
    }) 
  } 
  else {
    models.Quiz.findAll().then(function(quizes) {
        res.render('quizes/index', {quizes: quizes, errors: []});
    }) 
  } 
};

// GET /quizes/:id

exports.show = function(req, res) {
  res.render('quizes/show', {quiz: req.quiz, errors: []});
};

// GET /quizes/:id/answer

exports.answer = function(req, res) {
  var resultado = 'Incorrecto';
  if (req.query.respuesta === req.quiz.respuesta){
    resultado = 'Correcto';
  }
  res.render('quizes/answer', {quiz: req.quiz, 
                               respuesta: resultado, 
                               errors: []
                              });
};

// GET /quizes/new
exports.new = function(req, res) {
  var quiz = models.Quiz.build(
    {pregunta: "Pregunta", respuesta: "Respuesta"}
  );

  res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
  var quiz = models.Quiz.build( req.body.quiz );

  quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/new', {quiz: quiz, errors: err.errors});
      } else {
        quiz // save: guarda en DB campos pregunta y respuesta de quiz
        .save({fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes')}) 
      }      // res.redirect: Redirección HTTP a lista de preguntas
    }
  ).catch(function(error){next(error)});
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
  var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

  res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
  req.quiz.pregunta  = req.body.quiz.pregunta;
  req.quiz.respuesta = req.body.quiz.respuesta;
  req.quiz.tema = req.body.quiz.tema;

  req.quiz
  .validate()
  .then(
    function(err){
      if (err) {
        res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
      } else {
        req.quiz     // save: guarda campos pregunta y respuesta en DB
        .save( {fields: ["pregunta", "respuesta", "tema"]})
        .then( function(){ res.redirect('/quizes');});
      }     // Redirección HTTP a lista de preguntas (URL relativo)
    }
  ).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
  req.quiz.destroy().then( function() {
    res.redirect('/quizes');
  }).catch(function(error){next(error)});
};

// GET /quizes/statistics

exports.statistics = function(req, res) {

  var statistics = {totalQuizes:0,
                    totalComments:0,
                    avgCommentsQuiz:0,
                    numQuizesSinComments:0,
                    numQuizesConComments:0};

  models.Quiz.count().then(function(countQuizes) {
    statistics.totalQuizes = countQuizes;
    models.Comment.count().then(function(countComments) {
      statistics.totalComments = countComments;
      statistics.avgCommentsQuiz = 
                 (statistics.totalComments/statistics.totalQuizes).toFixed(2);
      models.Quiz.count({include: [{ model: models.Comment, required:true }],
                         distinct: true})
      .then(function(countConComments) {
        statistics.numQuizesConComments = countConComments;
        statistics.numQuizesSinComments = statistics.totalQuizes - countConComments;
        res.render('quizes/statistics', {statistics: statistics, errors: []});
      })
    })
  })

};

