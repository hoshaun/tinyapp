const generateRandomString = function(length) {
  const charSet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charSet.length);
    randomStr += charSet[randomIndex];
  }
  return randomStr;
};

const getUserByEmail = function(email, database) {
  for (const id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
  return undefined;
};

const urlsForUser = function(id, database) {
  const urls = {};
  for (const url in database) {
    if (database[url].userID === id) {
      urls[url] = database[url];
    }
  }
  return urls;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };