// TODO: why is this now a filter?
exports = module.exports = ['moment', function (moment) {
    return {
        scope: {
            date: '@date',
            watch: '@watch'
        },
        // link: function (scope, element, attrs) {
            
        // },
        controller: ['$scope', function (scope) {
            scope.readable = function () {
                if (!scope.date) {
                    return;
                }

                var oneHour = 1000 * 60 * 60;
                var oneDay = 24 * oneHour;
                var oneWeek = 7 * oneDay;
                var oneYear = 52 * oneWeek; // ok it's not perfect
                var now = moment();
                var date = moment(scope.date.toString());
                var diff = now.diff(date);

                if (!diff) {
                    scope.readableDate = now.fromNow();
                }
                else if (diff < oneHour) {
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
            };
            if (scope.watch) {
                scope.$watch('date', scope.readable);
            }
            scope.readable();
        }],
        template: '{{ readableDate }}'
    };
}];
