// Collections
var questionModel = require('../models/question'); // model for the question collection
var userModel = require('../models/user'); // model for the user collection


function parser(name) {
  var parsedName = name[0].toUpperCase() + name.slice(1).toLowerCase();
  return parsedName;
}


module.exports = function(router, passport) {

  router.route('/')
  .get(function (request, response) {
    response.json('Welcome to the Quizzer API!');
  });


  router.route('/login')
  .post(passport.authenticate('local-login'), function (request, response) {
    return response.json(request.user);
  });


  router.route('/loggedin')
  .get(function (request, response) {
    response.send(request.isAuthenticated() ? request.user : '0');
  });


  router.route('/signup')
  .get(function (request, response) {
    response.send('This is the signup page...Please proceed to POST!');
  })

  .post(passport.authenticate('local-signup'), function (request, response) {
    response.json(request.user);
  });


  // =====================================
  // LOGOUT ==============================
  // =====================================
  router.route('/logout')
  .post(function (request, response) {
      request.logout();
      response.redirect('/');
  });


  // =====================================
  // PROFILE =============================
  // =====================================

  router.route('/profile') 
  .get(function (request, response) { // show the current user's details
    return response.json(request.user);
  });


  router.route('/profile/:u_id/tags')
  .get(function (request, response) {
    var query = {user_id: request.params.u_id};
    questionModel.distinct('tag', 'tag -_id', function (err, tags) {
      if(err) {
        return response.send(err);
      }
      if(tags) {
        return response.json(tags);
      }
      return response.status(404).json('No data found!');
    });
  });


  router.route('/profile/:u_id/tags/:tag')
  .get(function (request, response) {
    if(request.params.tag) {

      var query = {
        user_id: request.params.u_id,
        tag: parser(request.params.tag)
      };
      questionModel.find(query, function (err, tag) {
        if(err) {
          return response.send(err);
        }
        if(tag) {
          return response.json(tag);
        }
        return response.status(404).json('No data found!');
      });
    }
  });


  router.route('/profile/:u_id/questions')
  .get(function (request, response) { // show all the questions created by the current user
    var query = {user_id: request.params.u_id};
    questionModel.find(query, function (err, questions) {
      if(err) {
        return response.send(err);
      }
      if(!questions) {
        response.send('No questions for this user!');
      }
      response.json(questions);
    });
  })

  .post(function (request, response) { // allow the current user to create a question
    if(request.body.name && request.body.tag && request.body.answer) {
      var query = {
        user_id: request.body.user_id,
        tag: parser(request.body.tag),
        name: parser(request.body.name),
        answer: parser(request.body.answer),
        wrongOptions: request.body.wrongOptions
      };

      questionModel.create(query, function (err, data) {
        if(err) {
          return response.send(err);
        }
        if(!data) {
          return response.status(400).json('Invalid request.');
        }
        response.status(201).json(data);
      });
    }
  });


  router.route('/profile/:u_id/questions/:id')
  .get(function (request, response) { // find a question with its id for the current user
    if(request.params.id) {
      var query = {
        user_id: request.params.u_id,
        _id: request.params.id
      };

      questionModel.findOne(query, function (err, question) {
        if(err) {
          return response.send(err);
        }
        if(!question) {
          return response.status(404).json('Oops! No question found here.');
        }
        response.json(question);
      });
    }
  })

  .put(function (request, response) { // update a question with its id
    if(request.params.id) {
      var query = {
        _id: request.params.id,
        user_id: request.params.u_id
      };

      var updateData = {
        tag: parser(request.body.tag),
        name: request.body.name,
        answer: request.body.answer,
        wrongOptions: request.body.wrongOptions
      };

      questionModel.findOneAndUpdate(query, {$set: updateData}, function (err, data) {
        if(err) {
          return response.send(err);
        }
        return response.json(data + ' document was successfully updated!');
      });
    }
  })

  .delete(function (request, response) {
    if(request.body.id) {
      var query = {_id: request.body.id, user_id: request.body.user_id};

      questionModel.findOneAndRemove(query, function (err, data) {
        if(err) {
          return response.send(err);
        }
        return response.json(data);
      });
    }
  });


  // =====================================================
  // TAGS ================================================
  // =====================================================

  // list all tags
  router.route('/tags')
  .get(function (request, response) {
    var query = {};
    questionModel.distinct('tag', 'tag -_id', function (err, tags) {
      if(err) {
        return response.send(err);
      }
      if(tags) {
        return response.json(tags);
      }
      return response.status(404).json('No data found!');
    });
  });


  // list a single tag and its questions
  router.route('/tags/:tag')
  .get(function (request, response) {
    if(request.params.tag) {

      var query = {tag: parser(request.params.tag)};
      questionModel.find(query, function (err, tag) {
        if(err) {
          return response.send(err);
        }
        if(tag) {
          return response.json(tag);
        }
        return response.status(404).json('No data found!');
      });
    }
  });



  // ================================================
  // QUESTIONS ======================================
  // ================================================

  // list all questions that have been created
  router.route('/questions')
  .get(function (request, response) {
    var query = {};
    questionModel.find(query, function (err, questions) {
      if(err) {
        return response.send(err);
      }
      if(questions) {
        return response.json(questions);
      }
    });
  });


  //list a single question by its id
  router.route('/questions/:id')
  .get(function (request, response) {
    if(request.params.id) {
      var query = {_id: request.params.id};
      questionModel.findById(query, function (err, question) {
        if(err) {
          return response.send(err);
        }
        if(question) {
          return response.json(question);
        }
        else {
          return response.status(404).json('No data found!');
        }
      });
    }
  });



  // ======================================================
  // USERS ================================================
  // ======================================================


  // list all users
  router.route('/users')
  .get(function (request, response) {
    userModel.find(function (err, users) {
      if(err) {
        return response.send(err);
      }
      return response.json(users);
    });
  });


  // list a single user
  router.route('/users/:id')
  .get(function (request, response) {
    if(request.params.id) {
      var query = {_id: request.params.id};
      userModel.findById(query, function (err, user) {
        if(err) {
          return response.send(err);
        }
        return response.json(user);
      });
    }
  });


  // list all the questions from a single user
  router.route('/users/:id/questions')
  .get(function (request, response) {
    if(request.params.id) {
      var query = {user_id: request.params.id};
      questionModel.find(query, function (err, questions) {
        if(err) {
          return response.send(err);
        }
        return response.json(questions);
      });
    }
  });



  // route middleware to make sure a user is logged in
  function isLoggedIn(request, response, next) {
    // if user isn't authenticated in the session, send a 401 
    if (request.isAuthenticated()) {
      return next();
    }

    // if they are, carry on
    // response.redirect('/');
    response.sendStatus(401);
  }
};

