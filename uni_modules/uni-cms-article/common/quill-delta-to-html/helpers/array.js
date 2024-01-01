function preferSecond(arr) {
    if (arr.length === 0) {
        return null;
    }
    return arr.length >= 2 ? arr[1] : arr[0];
}
function flatten(arr) {
    return arr.reduce((pv, v) => {
        return pv.concat(Array.isArray(v) ? flatten(v) : v);
    }, []);
}
function find(arr, predicate) {
    if (Array.prototype.find) {
        return Array.prototype.find.call(arr, predicate);
    }
    for (var i = 0; i < arr.length; i++) {
        if (predicate(arr[i]))
            return arr[i];
    }
    return undefined;
}
function groupConsecutiveElementsWhile(arr, predicate) {
    var groups = [];
    var currElm, currGroup;
    for (var i = 0; i < arr.length; i++) {
        currElm = arr[i];
        if (i > 0 && predicate(currElm, arr[i - 1])) {
            currGroup = groups[groups.length - 1];
            currGroup.push(currElm);
        }
        else {
            groups.push([currElm]);
        }
    }
    return groups.map((g) => (g.length === 1 ? g[0] : g));
}
function sliceFromReverseWhile(arr, startIndex, predicate) {
    var result = {
        elements: [],
        sliceStartsAt: -1,
    };
    for (var i = startIndex; i >= 0; i--) {
        if (!predicate(arr[i])) {
            break;
        }
        result.sliceStartsAt = i;
        result.elements.unshift(arr[i]);
    }
    return result;
}
function intersperse(arr, item) {
    return arr.reduce((pv, v, index) => {
        pv.push(v);
        if (index < arr.length - 1) {
            pv.push(item);
        }
        return pv;
    }, []);
}
export { preferSecond, flatten, groupConsecutiveElementsWhile, sliceFromReverseWhile, intersperse, find, };
