'use strict';

module.exports = function routes(app, users) {
  const getUser = request => {
    const token = request.headers['authentication-token'];
    if (!token) {
      return null;
    }

    const matchingUser = Object.keys(users)
      .map(k => users[k])
      .find(u => u.token === token);
    if (!matchingUser) {
      return null;
    }

    return matchingUser.username;
  };

  const bu = fn => {
    return function bindUser(req, response) {
      const user = getUser(req);
      if (!user) {
        response.sendStatus(401);
        return null;
      }

      return fn(user, req, response);
    };
  };

  app.post('/api/contacts/add', bu((user, req, response) => {
    const contacts = req.body;

    users[user].contacts = (users[user].contacts || []).concat(contacts);

    response.send({});
  }));

  app.delete('/api/contacts/delete/:username',
    bu((user, req, response) => {
      const username = req.params.username;
      const contacts = users[user].contacts || [];

      const index = contacts.findIndex(u => u.username === username);
      contacts.splice(index, 1);

      response.send({});
    }));

  app.get('/api/contacts/list', bu((user, req, response) => {
    const list = Object.keys(users).map( // remove security token
      key => Object.assign({}, users[key], { token: undefined }));

    response.send(list);
  }));

  app.get('/api/contacts/change-presence/:presence',
    bu((user, req, response) => {
      users[user].presence = req.params.presence;

      response.status(200).send({});
    }));
};
