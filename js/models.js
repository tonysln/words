var Letter = Backbone.Model.extend({
  defaults: function() {
    return {
      letter: "",
      total_words: 0,
      guessed_words: 0,
    }
  },
});


var Wordbank = Backbone.Model.extend({
  defaults: function() {
    return {
      letters: [],
      wordlist: "frequency_en_50k",
      language: "en",
      total_words: 0, // sum up letters
      guessed_words: 0, // sum up letters
    }
  },
});


var Player = Backbone.Model.extend({
  defaults: function() {
    return {
      name: "localhost",
      ip: "127.0.0.1",
      score: 0.0,
      joined_time: null,
      last_active_time: null
    }
  },
});


var Room = Backbone.Model.extend({
  defaults: function() {
    return {
      start_time: null,
      last_active_time: null, // max of players last_active_time
      end_time: null,
      ID: "", 
      name: "",
      word_meta: null, 
      guessed_words: {},
      difficulty: 100.0,
      got_words: 0,
      wordbank: null,
      players: [],
      score: 0.0 // sum of players
    };
  },

  toggle: function() {
    this.save({done: !this.get("done")});
  },

  reCalculateScore: function() {
    this.save({score: 0.0});
  },

  updateEndTime: function() {

  },

  saveToLocalStorage: function() {

  },

  loadFromLocalStorage: function() {

  },
});






