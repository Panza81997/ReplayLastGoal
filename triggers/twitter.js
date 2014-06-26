// var RECORD_URL_QUERY = "?start=-8&duration=20";
var RECORD_URL_QUERY = "?window=default";
var TWITTER_USERNAME = "GoalFlash";

var twitter = require('twitter')
  , humanize = require('humanize')
  , request = require('request')
  , env = process.env.NODE_ENV || "development"
  , settings = require('../settings.'+env+'.json')
  ;


var mapping = {
  "USA": "ned1",
  "POR": "ned2",
  "BEL": "ned3",
  "ALG": "ned1"
}

var getChannel = function(tweet) {
  for(var i in mapping) {
    if(tweet.match(new RegExp(i))) return mapping[i];
  }
  return "ned1";
}

var twit = new twitter(settings.twitter);

var makeMessage = function(tweet) {
  var text = tweet.replace(/http.*/i,'').replace(/^RT @[a-zA-Z]{1,15}:? ?/i,'').replace(/ $/,'');

  // Initial pattern from @GoalFlash: "Chile 1-1* Netherlands (44') #CHI vs #NED http://www.goal.com/  #GoalFlash #WorldCup"
  // var matches = text.match(/(.*) (\*?[0-9]\-[0-9]\*?) (.*) \(([0-9]+)'\).*(#[A-Z]{3}) vs (#[A-Z]{3})/);

  // New pattern: "Italy 0-1* Uruguay (81') #ITAvsURU http://t.co/xsiYol5i5F #GoalFlash #WorldCup"
  var matches = text.match(/(.*) (\*?[0-9]\-[0-9]\*?) (.*) \(([0-9]+)'\).*#([A-Z]{3})vs([A-Z]{3})/);

  if(matches && matches.length > 6) {
    var scorer, against;
    var team1 = { name: matches[1], hashtag: matches[5] };
    var team2 = { name: matches[3], hashtag: matches[6] };
    var score = matches[2];
    var time  = matches[4];

    if(score[0] == '*') {
      scorer = team1;
      against = team2;
    }
    else {
      scorer = team2;
      against = team1;
    }
    score = score.replace('*','');

    text = "Goal for "+scorer.name+"! #"+team1.hashtag+" "+score+" #"+team2.hashtag;
  }

  // If text length allows it, we add the #GoalFlash hashtag
  // (21 chars for video link, 21 chars for gif link, plus spaces)
  if(text.length < 140 - 22 - 22 - 11 - 14) {
    text += " #GoalFlash";
  }

  text += " \n📺HD Video:"; // 14 chars long
  
  return text;

};

//var lastTweet = 'RT #BRA @GoalFlash: Colombia 3-1* Greece (90\') #COL vs #GRE http://t.co/xsiYol5i5F #GoalFlash #WorldCup';

/* For testing:
setTimeout(function() {
  var tweet= "RT @GoalFlash: Italy 0-1* Uruguay (81') #ITAvsURU http://t.co/xsiYol5i5F #GoalFlash #WorldCup";
  var text = makeMessage(tweet);
  var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&channel="+getChannel(text)+"&text="+encodeURIComponent(text);
  console.log("Text: ", text);
      var tweet = { text: text }; 
      if(tweet.text.match(/correction/i)) {
        twit.updateStatus(tweet.text, function(data) {}); 
        return;
      }
  console.log("Request: ", url);
  request(url, function(err, res, body) {
    console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
  });
}, 1000);
*/

console.log(humanize.date("Y-m-d H:i:s")+" Connecting to the Twitter Stream for @"+TWITTER_USERNAME);
twit.stream('user', {track:TWITTER_USERNAME}, function(stream) {
    console.log(humanize.date("Y-m-d H:i:s")+" Connected");
    stream.on('data', function(tweet) {
      if(!tweet.text) return;
      if(tweet.user.screen_name != TWITTER_USERNAME) return;
      console.log(humanize.date("Y-m-d H:i:s")+" tweet.text: ", tweet.text);
      // If the tweet is just correcting the score, just tweet it without generating a video
      if(tweet.text.match(/correction/i)) {
        // We wait 20s to tweet to make sure we don't tweet the correction
        // before the video of the disallowed goal
        setTimeout(function() {
          twit.updateStatus(tweet.text, function(data) {}); 
        }, 20000); 
        return;
      }
      var text = makeMessage(tweet.text);
      var url = "http://localhost:"+settings.port+"/record"+RECORD_URL_QUERY+"&channel="+getChannel(text)+"&text="+encodeURIComponent(text);
      request(url, function(err, res, body) {
        console.log(humanize.date("Y-m-d H:i:s")+" "+url+": ", body);
      });
    });

    stream.on('error', function(error) {
      console.error("Error in the twitter stream: ", error);
      process.exit(1);
    });

    stream.on('end', function(error) {
      console.error("Twitter stream ended - exiting");
      process.exit(1);
    });
});
