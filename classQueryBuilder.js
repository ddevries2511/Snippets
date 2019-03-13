/**
 * Class to build a MongoDB aggregation pipeline
 * 
 * WIP!
 */

var instance;

class QueryBuilder {
    /**
     * Builds a Mongoose query based on model and options
     * 
     * @param {*} modelObj Mongoose model
     * @param {filters, select, sort return} options 
     * 
     * @returns Object containing query object, select string and sort object
     */
    buildPipelineByOptions(modelObj, options) {
        console.log(JSON.stringify(options, undefined, 2));
        
        var self = this;
        var pipeline = [];

        // Create "$match" pipeline part for given filters
        if (options.filters && typeof options.filters === 'object') {
            var pipelineMatch = {
                $match: {}
            }

            for (const k in options.filters) {
                const filterItem = options.filters[k];

                if (k === "and" || k === "or") {
                    const pipelinePart = self.buildAggrOperatorPart(filterItem, k);

                    if (pipelinePart && pipelinePart.pipeline && pipelinePart.pipeline[pipelinePart.operator])
                        pipelineMatch.$match[pipelinePart.operator] = pipelinePart.pipeline[pipelinePart.operator];
                } else {
                    if (modelObj[k]) { // Check if filterItem exists in model
                        if (typeof filterItem === 'object' && filterItem.value != undefined && filterItem.value != null) { // Check required data for filter object
                            let typeShouldbe = new modelObj[k].type().constructor.name.toString().toLowerCase();
                            let typeToCheck = typeof filterItem.value;

                            if (typeToCheck === typeShouldbe) { // Check if value is of expected type
                                if (filterItem.condition) { // Create pipeline part for k with condition if condition is given
                                    pipelineMatch.$match[k] = {};
                                    pipelineMatch.$match[k]["$" + filterItem.condition] = filterItem.value;
                                } else // Create pipeline part as 'key' = 'value'
                                    pipelineMatch.$match[k] = filterItem.value;
                            }
                        }
                    }
                }
            }

            pipeline.push(pipelineMatch);
        }

        // Create "$project" pipeline part
        if (options.select && Array.isArray(options.select) && options.select.length > 0) {
            var pipelineProject = {
                $project: {}
            }

            options.select.forEach(select => {
                pipelineProject.$project[select] = 1;
            });

            pipeline.push(pipelineProject);
        }

        // Create $group pipeline part
        if (options.return && options.return.count) {
            var countOptions = options.return.count;
            var pipelineGroup = {
                $group: {}
            };

            var build = function (option) {
                // We will only continue if all required data is available
                if (option.key && option.type && option.format) {
                    pipelineGroup.$group = self.buildAggrGroupPart(option.key, option.type, option.format);

                    pipeline.push(pipelineGroup);
                }
            }
            if (countOptions && Array.isArray(countOptions))
                countOptions.forEach(option => {
                    build(option);
                });
            else
                build(countOptions);
        }

        // Create $sort pipeline part
        if (options.sort) {
            var pipelineSort = {
                $sort: {}
            }

            var build = function (sortObj) {
                if (sortObj && typeof sortObj === 'object' && sortObj.by && sortObj.by.length > 0) { // Check required data for sort object
                    if (Object.keys(modelObj).indexOf(sortObj.by) > -1) { // Check if sortObj.by is a valid key to sort by
                        let order = 1; // Set default order to ascending

                        if (sortObj.order)
                            order = (sortObj.order.toLowerCase() === 'desc') ? -1 : order;

                        // Set sortBy to _id.* if a pipeline $group is created and the sort exists
                        let sortBy;
                        if (pipelineGroup) {
                            if (pipelineGroup.$group._id && Object.keys(pipelineGroup.$group._id).indexOf(sortObj.by) > -1)
                                sortBy = '_id.' + sortObj.by;
                        } else
                            sortBy = sortObj.by;

                        pipelineSort.$sort[sortBy] = order;
                    }
                }
            }

            if (Array.isArray(options.sort) && options.sort.length > 0) {
                options.sort.forEach(sortObj => {
                    build(sortObj);
                });
            } else
                build(options.sort);

            pipeline.push(pipelineSort);
        }

        console.log(JSON.stringify(pipeline, undefined, 2));

        return pipeline;
    }

    buildAggrOperatorPart(inputArray, key) {
        if (Array.isArray(inputArray) && inputArray.length > 0) {
            key = "$" + key;
            var returnObj = {
                operator: key,
                pipeline: {}
            };
            returnObj.pipeline[key] = [];

            inputArray.forEach(filterObj => {
                for (const k in filterObj) {
                    const obj = filterObj[k];
                    if (obj.value != undefined && obj.value != null && obj.condition) {
                        var toPush = {};
                        toPush[k] = {};
                        toPush[k]["$" + obj.condition] = obj.value;
                        returnObj.pipeline[key].push(toPush);
                    }
                }
            });

            return returnObj;
        }
    }

    buildAggrGroupPart(key, type, format) {
        var returnObj = { _id: {} };

        if (key && type && format) {
            switch (type) {
                case 'date':
                    returnObj._id[key] = this.buildAggrToDateString(format, key);

                    returnObj.count = { $sum: 1 };
                    break;

                default:
                    break;
            }
        } else
            returnObj = { _id: null };

        return returnObj;
    }

    buildAggrToDateString(format, key) {
        var toDateString;

        var buildByFormat = function (formatKey) {
            var toString = { "$toString": {} };

            toString["$toString"]["$" + formatKey] = { "$toDate": "$" + key };

            return toString;
        };

        var buildWeek = function () {
            return {
                "$cond": [
                    { "$lte": [{ "$isoWeek": { "$toDate": "$" + key } }, 9] },
                    {
                        "$concat": [
                            "0", { "$substr": [{ "$isoWeek": { "$toDate": "$" + key } }, 0, 2] }
                        ]
                    },
                    { "$substr": [{ "$isoWeek": { "$toDate": "$" + key } }, 0, 2] }
                ]
            };
        };

        var buildYear = function () {
            return { "$substr": [{ "$year": { "$toDate": "$" + key } }, 0, 4] };
        }

        var buildMonth = function () {
            return {
                "$cond": [
                    { "$lte": [{ "$month": { "$toDate": "$" + key } }, 9] },
                    {
                        "$concat": [
                            "0", { "$substr": [{ "$month": { "$toDate": "$" + key } }, 0, 2] }
                        ]
                    },
                    { "$substr": [{ "$month": { "$toDate": "$" + key } }, 0, 2] }
                ]
            };
        }

        var buildDay = function () {
            return {
                "$cond": [
                    { "$lte": [{ "$dayOfMonth": { "$toDate": "$" + key } }, 9] },
                    {
                        "$concat": [
                            "0", { "$substr": [{ "$dayOfMonth": { "$toDate": "$" + key } }, 0, 2] }
                        ]
                    },
                    { "$substr": [{ "$dayOfMonth": { "$toDate": "$" + key } }, 0, 2] }
                ]
            };
        }

        var buildHour = function () {
            return {
                "$cond": [
                    { "$lte": [{ "$hour": { "$toDate": "$" + key } }, 9] },
                    {
                        "$concat": [
                            "0", { "$substr": [{ "$hour": { "$toDate": "$" + key } }, 0, 2] }
                        ]
                    },
                    { "$substr": [{ "$hour": { "$toDate": "$" + key } }, 0, 2] }
                ]
            };
        }

        var buildMinute = function () {
            return {
                "$cond": [
                    { "$lte": [{ "$minute": { "$toDate": "$" + key } }, 9] },
                    {
                        "$concat": [
                            "0", { "$substr": [{ "$minute": { "$toDate": "$" + key } }, 0, 2] }
                        ]
                    },
                    { "$substr": [{ "$minute": { "$toDate": "$" + key } }, 0, 2] }
                ]
            };
        }

        var buildSecond = function () {
            return {
                "$cond": [
                    { "$lte": [{ "$second": { "$toDate": "$" + key } }, 9] },
                    {
                        "$concat": [
                            "0", { "$substr": [{ "$second": { "$toDate": "$" + key } }, 0, 2] }
                        ]
                    },
                    { "$substr": [{ "$second": { "$toDate": "$" + key } }, 0, 2] }
                ]
            };
        }

        switch (format) {
            case 'hour':
                toDateString = {
                    "$concat": [
                        buildYear(),
                        "-",
                        buildMonth(),
                        "-",
                        buildDay(),
                        "T",
                        buildHour()
                    ]
                };
                break;

            case 'day':
                toDateString = {
                    "$concat": [
                        buildYear(),
                        "-",
                        buildMonth(),
                        "-",
                        buildDay()
                    ]
                };
                break;

            case 'week':
                toDateString = {
                    "$concat": [
                        buildYear(),
                        "-W",
                        buildWeek(),
                    ]
                };
                break;

            case 'month':
                toDateString = {
                    "$concat": [
                        buildYear(),
                        "-",
                        buildMonth()
                    ]
                };
                break;

            case 'year':
                toDateString = {
                    "$concat": [
                        buildYear()
                    ]
                };
                break;

            default:
                break;
        }

        return toDateString;
    }
}

function getInstance() {
    if (!instance)
        instance = new QueryBuilder();

    return instance;
}

module.exports = {
    getInstance
};