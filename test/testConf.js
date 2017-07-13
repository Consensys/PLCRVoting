module.exports = function(accounts) {
    [owner, ...user] = accounts;
    this.owner = owner;
    this.user = user;
};
