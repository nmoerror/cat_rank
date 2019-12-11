MyApp = new Backbone.Marionette.Application();

MyApp.addRegions({
  mainRegion: "#content"
});

Cat = Backbone.Model.extend({
  defaults: {
    votes: 0
  },

  addVote: function() {
    this.set("votes", this.get("votes") + 1);
  },

  rankUp: function() {
    this.set({ rank: this.get("rank") - 1 });
  },

  rankDown: function() {
    this.set({ rank: this.get("rank") + 1 });
  }
});

CatCollection = Backbone.Collection.extend({
  model: Cat,

  initialize: function(cats) {
    var rank = 1;
    _.each(cats, function(cat) {
      cat.rank = rank;
      ++rank;
    });

    this.on("add", function(cat) {
      if (!cat.get("rank")) {
        cat.set("rank", this.size());
        this.sort();
      }
    });

    var self = this;

    MyApp.on("trigger:rank:up", function(cat) {
      if (cat.get("rank") == 1) {
        return true;
      }
      self.rankUp(cat);
      self.sort();
    });

    MyApp.on("trigger:rank:down", function(cat) {
      if (cat.get("rank") == self.size()) {
        return true;
      }
      self.rankDown(cat);
      self.sort();
    });

    MyApp.on("trigger:disqualify", function(cat) {
      var disqualifiedRank = cat.get("rank");
      var catsToUprank = self.filter(function(cat) {
        return cat.get("rank") > disqualifiedRank;
      });
      catsToUprank.forEach(function(cat) {
        cat.rankUp();
      });
      self.trigger("reset");
    });
  },

  comparator: function(cat) {
    return cat.get("rank");
  },

  rankUp: function(cat) {
    var rankToSwap = cat.get("rank") - 1;
    var otherCat = this.at(rankToSwap - 1);

    cat.rankUp();
    otherCat.rankDown();
  },

  rankDown: function(cat) {
    var rankToSwap = cat.get("rank") + 1;
    var otherCat = this.at(rankToSwap - 1);

    cat.rankDown();
    otherCat.rankUp();
  }
});

CatView = Backbone.Marionette.ItemView.extend({
  tagName: "tr",
  className: "cat",
  template: _.template(
    "<td><%= rank %></td>" +
      "<td><%= votes %></td>" +
      "<td><%= name %></td>" +
      '<td><img class="cat-photo" src="<%= image %>"></td>' +
      '<td><ul class="stack button-group"><li><button class="rank-up tiny alert"><img class="arrow" src="./img/icon-arrow-up.png"></button></li>' +
      '<li><button class="rank-down tiny"><img class="arrow" src="./img/icon-arrow-down.png"></button></li></ul>' +
      '<button class="cat-disqualify tiny secondary">Disqualify</button></td>'
  ),

  ui: {
    buttonUp: ".rank-up",
    buttonDown: ".rank-down",
    buttonDisqualify: ".cat-disqualify"
  },

  events: {
    "click @ui.buttonUp": "rankUp",
    "click @ui.buttonDown": "rankDown",
    "click @ui.buttonDisqualify": "disqualify"
  },

  modelEvents: {
    "change:votes": "render"
  },

  rankUp: function() {
    this.model.addVote();
    MyApp.trigger("trigger:rank:up", this.model);
  },

  rankDown: function() {
    this.model.addVote();
    MyApp.trigger("trigger:rank:down", this.model);
  },

  disqualify: function() {
    this.model.destroy();
    MyApp.trigger("trigger:disqualify", this.model);
  }
});

CatCollectionView = Backbone.Marionette.CompositeView.extend({
  childView: CatView,
  childViewContainer: "tbody",
  className: "cat-table",
  tagName: "table",
  template: _.template(
    "<thead>" +
      "<th>Rank</th>" +
      "<th>Votes</th>" +
      "<th>Name</th>" +
      "<th>Photo</th>" +
      "<th>Action</th>" +
      "</thead>" +
      "<tbody></tbody>"
  )
});

MyApp.on("start", function(options) {
  var that = this;
  var catCollectionView = new CatCollectionView({
    collection: options.cats
  });

  MyApp.mainRegion.show(catCollectionView);
});

$(document).ready(function() {
  var cats = new CatCollection([
    {
      name: "Colonel Meow",
      image: "./img/colonel-meow.jpg"
    },
    {
      name: "Garfi",
      image: "./img/garfi.jpg"
    },
    {
      name: "Grumpy Cat",
      image: "./img/grumpy-cat.jpg"
    },
    {
      name: "Hamilton",
      image: "./img/hamilton.jpg"
    }
  ]);

  MyApp.start({ cats: cats });

  cats.add(
    new Cat({
      name: "Snoopy",
      image: "./img/snoopy.jpg"
    })
  );
});
