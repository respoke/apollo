// TODO: why is this now a filter?
exports = module.exports = ['moment', function (moment) {
    return {
        scope: {
            date: '@date'
        },
        link: function (scope, element, attrs) {
            if (!scope.date) {
                return;
            }
            var oneHour = 1000 * 60 * 60;
            var oneDay = 24 * oneHour;
            var oneWeek = 7 * oneDay;
            var oneYear = 52 * oneWeek; // ok it's not perfect
            var now = moment();
            var date = moment(scope.date);
            var diff = now.diff(date);

            if (diff < oneHour) {
                scope.readableDate = date.fromNow();
            }
            else if (diff < oneDay) {
                scope.readableDate = date.format('h:mm a');
            }
            else if (diff < oneWeek) {
                scope.readableDate = date.format('dddd');
            }
            else if (diff < oneYear) {
                scope.readableDate = date.format('MMM Do');
            }
            else {
                scope.readableDate = date.format('MMM Do, YYYY')
            }
        },
        template: '{{ readableDate }}'
    };
}];
