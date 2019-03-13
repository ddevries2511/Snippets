class BaseChart {
    constructor() {
        this.chartType;
        this.chartTitle;
        this.chartOptions = {
            maintainAspectRatio: false,
            title: {
                display: false,
                text: '',
                lineHeight: 2
            },
            legend: {
                position: 'bottom',
            },
            scales: {
                xAxes: [],
                yAxes: []
            }
        };
        this.chartData = {
            datasets: []
        };
        this.dataSets;
        this.backgroundColors = [
            'rgba(63, 81, 181, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)',
            'rgba(255, 159, 64, 0.2)'
        ];
        this.borderColors = [
            'rgba(63, 81, 181, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)'
        ];
        this.borderWidth = 1;

        this.scaleOptions = {
            xAxes: [
                {
                    name: 'timePerHour',
                    text: 'Tijd per uur',
                    value: [{
                        type: 'time',
                        time: {
                            unit: 'hour',
                            minUnit: 'hour'
                        }
                    }]
                },
                {
                    name: 'timePerDay',
                    text: 'Tijd per dag',
                    value: [{
                        type: 'time',
                        time: {
                            unit: 'day',
                            minUnit: 'day'
                        }
                    }]
                },
                {
                    name: 'timePerWeek',
                    text: 'Tijd per week',
                    value: [{
                        type: 'time',
                        time: {
                            minUnit: 'week',
                            isoWeekday: true
                        }
                    }]
                },
                {
                    name: 'timePerMonth',
                    text: 'Tijd per maand',
                    value: [{
                        type: 'time',
                        time: {
                            unit: 'month',
                            minUnit: 'month'
                        }
                    }]
                },
                {
                    name: 'timePerYear',
                    text: 'Tijd per jaar',
                    value: [{
                        type: 'time',
                        time: {
                            unit: 'year',
                            minUnit: 'year'
                        }
                    }]
                }
            ],
            yAxes: [
                {
                    name: 'beginAtZero',
                    text: 'Start bij 0',
                    value: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            ]
        };

        this.availableChartOptions = [
            {
                name: 'legend',
                displayName: 'Legenda positie',
                type: 'select',
                faIcon: 'fa-arrows-alt',
                validator: function (toCheck) {
                    let isValid = false;

                    if (toCheck) {
                        for (let index = 0; index < this.options.length; index++) {
                            if (JSON.stringify(toCheck) === JSON.stringify(this.options[index].value)) {
                                isValid = true;
                                break;
                            }
                        }
                    }

                    return isValid;
                },
                options: [
                    {
                        text: 'Boven',
                        value: {
                            position: 'top',
                        }
                    },
                    {
                        text: 'Onder',
                        value: {
                            position: 'bottom',
                        }
                    },
                    {
                        text: 'Links',
                        value: {
                            position: 'left',
                        }
                    },
                    {
                        text: 'Rechts',
                        value: {
                            position: 'right',
                        }
                    }
                ]
            },
            {
                name: 'title.text',
                displayName: 'Titel',
                type: 'string',
                faIcon: 'fa-heading',
                validator: function (toCheck) {
                    var isValid = false;

                    if (toCheck && typeof toCheck === "string" && toCheck.length > 0)
                        isValid = true;

                    return isValid;
                }
            },
            {
                name: 'title.display',
                displayName: 'Titel weergeven',
                type: 'boolean',
                validator: function (toCheck) {
                    var isValid = false;

                    if (typeof toCheck === 'boolean')
                        isValid = true;

                    return isValid;
                }
            },
            {
                name: 'scales.xAxes',
                displayName: 'x-as weergave',
                type: 'select',
                faIcon: 'fa-minus',
                validator: function (toCheck) {
                    let isValid = false;

                    if (toCheck) {
                        for (let index = 0; index < this.options.length; index++) {
                            if (JSON.stringify(toCheck) === JSON.stringify(this.options[index].value)) {
                                isValid = true;
                                break;
                            }
                        }
                    }

                    return isValid;
                },
                options: this.scaleOptions.xAxes
            },
            {
                name: 'scales.yAxes',
                displayName: 'y-as opties (OMBOUWEN NAAR CHECKBOXES)',
                type: 'select',
                faIcon: 'fa-minus',
                validator: function (toCheck) {
                    return true;
                    let isValid = false;

                    if (toCheck) {
                        for (let index = 0; index < this.options.length; index++) {
                            if (JSON.stringify(toCheck) === JSON.stringify(this.options[index].value)) {
                                isValid = true;
                                break;
                            }
                        }
                    }

                    return isValid;
                },
                options: this.scaleOptions.yAxes
            },
        ];

        this.chartCanvas = $('<canvas></canvas>');

        this.shownChart;
    }

    getName() {
        return this.displayName;
    }

    setOptions(extOptions) {
        var processOptions = function (extOption, target) {
            for (var k in extOption) {
                if (typeof extOption[k] == "object" && typeof target[k] == "object")
                    processOptions(extOption[k], target[k])
                else
                    target[k] = extOption[k]
            }
        }
        processOptions(extOptions, this.chartOptions);
    }

    setLabels(labels) {
        if (labels && Array.isArray(labels))
            this.chartData.labels = labels;
    }

    setDataSets(dataSets) {
        if (dataSets && Array.isArray(dataSets)) {
            dataSets.forEach((dataSet, i) => {
                if (typeof dataSet === 'object') {
                    // data check
                    if (dataSet.data && Array.isArray(dataSet.data)) {
                        // backgroundColor check
                        dataSet.backgroundColor = (dataSet.backgroundColor) ? dataSet.backgroundColor : this.backgroundColors[i];

                        // borderColor check
                        dataSet.borderColor = (dataSet.borderColor) ? dataSet.borderColor : this.borderColors[i];

                        // borderWidth check
                        dataSet.borderWidth = (dataSet.borderWidth) ? dataSet.borderWidth : this.borderWidth;
                    } else
                        console.error('Ivalid dataSet.data', dataSet.data);
                }
            });

            this.chartData.datasets = dataSets;
        }
    }

    show() {
        var chartProps = {
            type: this.chartType,
            data: this.chartData,
            options: this.chartOptions
        };

        this.shownChart = new Chart(this.chartCanvas, chartProps);

        return this.chartCanvas;
    }

    getForm() {
        var self = this;
        var formPart = $('<div></div>')
            .addClass('form-part');

        formPart.validators = [];

        self.availableChartOptions.forEach(option => {
            var input;

            switch (option.type) {
                case 'select':
                    var validator = () => {
                        var returnObj = {
                            isValid: false,
                            targetElem: input.find('select')
                        };

                        returnObj.isValid = option.validator(iterateObjByString(option.name, self.chartOptions));

                        return returnObj;
                    }

                    input = getSelectField(option.faIcon, option.displayName, option.options, (selected) => {
                        self.setOptions(constructObject(option.name.split("."), selected));
                    }, self.chartOptions[option.name], true);

                    if (option.validator)
                        formPart.validators.push(validator);
                    break;

                case 'string':
                    var validator = () => {
                        var returnObj = {
                            isValid: false,
                            targetElem: input.find('input')
                        };

                        returnObj.isValid = option.validator(iterateObjByString(option.name, self.chartOptions));

                        return returnObj;
                    }

                    input = getNormalTextField(option.faIcon, option.displayName, (val) => {
                        self.setOptions(constructObject(option.name.split("."), val));
                    }, undefined);

                    if (option.validator)
                        formPart.validators.push(validator);
                    break;

                case 'boolean':
                    var validator = () => {
                        var returnObj = {
                            isValid: false
                        };

                        returnObj.isValid = option.validator(iterateObjByString(option.name, self.chartOptions));

                        return returnObj;
                    }

                    input = getDefaultCheckbox(option.displayName, false, (isChecked) => {
                        self.setOptions(constructObject(option.name.split("."), isChecked));
                    });

                    if (option.validator)
                        formPart.validators.push(validator);
                    break;

                default:
                    break;
            }

            if (input)
                formPart.append(input);
        });

        return formPart;
    }

    getChart() {
        return this.shownChart;
    }
}