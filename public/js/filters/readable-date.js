exports = module.exports = ['moment', function (moment) {
    var oneMinute = 1000 * 60;
    var oneHour = 60 * oneMinute;
    var oneDay = 24 * oneHour;
    var oneWeek = 7 * oneDay;
    var oneYear = 52 * oneWeek; // ok it's not perfect

    return function (item) {
        if (!item) {
            return item;
        }

        var now = moment();
        var date = moment(item.toString());
        var diff = now.diff(date);

        if (!diff) {
            return now.fromNow();
        }
        else if (diff < oneMinute) {
            return 'just now';
        }
        else if (diff < oneHour) {
            return date.fromNow();
        }
        else if (diff < oneDay) {
            return date.format('h:mm a');
        }
        else if (diff < oneWeek) {
            return date.format('dddd');
        }
        else if (diff < oneYear) {
            return date.format('MMM Do');
        }
        else {
            return date.format('MMM Do, YYYY');
        }
    }
}];
