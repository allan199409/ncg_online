var QueryString = (function() {
    const QueryString = {};
    function ParsedQueryString() {}
    ParsedQueryString.prototype = Object.create(null);

    function qsUnescape(s, decodeSpaces) {
      try {
        return decodeURIComponent(s);
      } catch (e) {
        return QueryString.unescapeBuffer(s, decodeSpaces).toString();
      }
    }
    QueryString.unescape = qsUnescape;


    var hexTable = new Array(256);
    for (var i = 0; i < 256; ++i)
      hexTable[i] = '%' + ((i < 16 ? '0' : '') + i.toString(16)).toUpperCase();
    QueryString.escape = function(str) {
      if (typeof str !== 'string') {
        if (typeof str === 'object')
          str = String(str);
        else
          str += '';
      }
      var out = '';
      var lastPos = 0;

      for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);

        if (c === 0x21 || c === 0x2D || c === 0x2E || c === 0x5F || c === 0x7E ||
            (c >= 0x27 && c <= 0x2A) ||
            (c >= 0x30 && c <= 0x39) ||
            (c >= 0x41 && c <= 0x5A) ||
            (c >= 0x61 && c <= 0x7A)) {
          continue;
        }

        if (i - lastPos > 0)
          out += str.slice(lastPos, i);

        if (c < 0x80) {
          lastPos = i + 1;
          out += hexTable[c];
          continue;
        }

        if (c < 0x800) {
          lastPos = i + 1;
          out += hexTable[0xC0 | (c >> 6)] + hexTable[0x80 | (c & 0x3F)];
          continue;
        }
        if (c < 0xD800 || c >= 0xE000) {
          lastPos = i + 1;
          out += hexTable[0xE0 | (c >> 12)] +
                 hexTable[0x80 | ((c >> 6) & 0x3F)] +
                 hexTable[0x80 | (c & 0x3F)];
          continue;
        }

        ++i;
        var c2;
        if (i < str.length)
          c2 = str.charCodeAt(i) & 0x3FF;
        else
          throw new URIError('URI malformed');
        lastPos = i + 1;
        c = 0x10000 + (((c & 0x3FF) << 10) | c2);
        out += hexTable[0xF0 | (c >> 18)] +
               hexTable[0x80 | ((c >> 12) & 0x3F)] +
               hexTable[0x80 | ((c >> 6) & 0x3F)] +
               hexTable[0x80 | (c & 0x3F)];
      }
      if (lastPos === 0)
        return str;
      if (lastPos < str.length)
        return out + str.slice(lastPos);
      return out;
    };

    var stringifyPrimitive = function(v) {
      if (typeof v === 'string')
        return v;
      if (typeof v === 'number' && isFinite(v))
        return '' + v;
      if (typeof v === 'boolean')
        return v ? 'true' : 'false';
      return '';
    };


    QueryString.stringify = QueryString.encode = function(obj, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';

      var encode = QueryString.escape;
      if (options && typeof options.encodeURIComponent === 'function') {
        encode = options.encodeURIComponent;
      }

      if (obj !== null && typeof obj === 'object') {
        var keys = Object.keys(obj);
        var len = keys.length;
        var flast = len - 1;
        var fields = '';
        for (var i = 0; i < len; ++i) {
          var k = keys[i];
          var v = obj[k];
          var ks = encode(stringifyPrimitive(k)) + eq;

          if (Array.isArray(v)) {
            var vlen = v.length;
            var vlast = vlen - 1;
            for (var j = 0; j < vlen; ++j) {
              fields += ks + encode(stringifyPrimitive(v[j]));
              if (j < vlast)
                fields += sep;
            }
            if (vlen && i < flast)
              fields += sep;
          } else {
            fields += ks + encode(stringifyPrimitive(v));
            if (i < flast)
              fields += sep;
          }
        }
        return fields;
      }
      return '';
    };

    QueryString.parse = QueryString.decode = function(qs, sep, eq, options) {
      sep = sep || '&';
      eq = eq || '=';

      const obj = new ParsedQueryString();

      if (typeof qs !== 'string' || qs.length === 0) {
        return obj;
      }

      if (typeof sep !== 'string')
        sep += '';

      const eqLen = eq.length;
      const sepLen = sep.length;

      var maxKeys = 1000;
      if (options && typeof options.maxKeys === 'number') {
        maxKeys = options.maxKeys;
      }

      var pairs = Infinity;
      if (maxKeys > 0)
        pairs = maxKeys;

      var decode = QueryString.unescape;
      if (options && typeof options.decodeURIComponent === 'function') {
        decode = options.decodeURIComponent;
      }
      const customDecode = (decode !== qsUnescape);

      const keys = [];
      var lastPos = 0;
      var sepIdx = 0;
      var eqIdx = 0;
      var key = '';
      var value = '';
      var keyEncoded = customDecode;
      var valEncoded = customDecode;
      var encodeCheck = 0;
      for (var i = 0; i < qs.length; ++i) {
        const code = qs.charCodeAt(i);

        if (code === sep.charCodeAt(sepIdx)) {
          if (++sepIdx === sepLen) {
            const end = i - sepIdx + 1;
            if (eqIdx < eqLen) {
              if (lastPos < end)
                key += qs.slice(lastPos, end);
            } else if (lastPos < end)
              value += qs.slice(lastPos, end);
            if (keyEncoded)
              key = decodeStr(key, decode);
            if (valEncoded)
              value = decodeStr(value, decode);
            if (keys.indexOf(key) === -1) {
              obj[key] = value;
              keys[keys.length] = key;
            } else {
              const curValue = obj[key];
              if (curValue instanceof Array)
                curValue[curValue.length] = value;
              else
                obj[key] = [curValue, value];
            }
            if (--pairs === 0)
              break;
            keyEncoded = valEncoded = customDecode;
            encodeCheck = 0;
            key = value = '';
            lastPos = i + 1;
            sepIdx = eqIdx = 0;
          }
          continue;
        } else {
          sepIdx = 0;
          if (!valEncoded) {
            if (code === 37/*%*/) {
              encodeCheck = 1;
            } else if (encodeCheck > 0 &&
                       ((code >= 48/*0*/ && code <= 57/*9*/) ||
                        (code >= 65/*A*/ && code <= 70/*F*/) ||
                        (code >= 97/*a*/ && code <= 102/*f*/))) {
              if (++encodeCheck === 3)
                valEncoded = true;
            } else {
              encodeCheck = 0;
            }
          }
        }

        if (eqIdx < eqLen) {
          if (code === eq.charCodeAt(eqIdx)) {
            if (++eqIdx === eqLen) {
              const end = i - eqIdx + 1;
              if (lastPos < end)
                key += qs.slice(lastPos, end);
              encodeCheck = 0;
              lastPos = i + 1;
            }
            continue;
          } else {
            eqIdx = 0;
            if (!keyEncoded) {

              if (code === 37/*%*/) {
                encodeCheck = 1;
              } else if (encodeCheck > 0 &&
                         ((code >= 48/*0*/ && code <= 57/*9*/) ||
                          (code >= 65/*A*/ && code <= 70/*F*/) ||
                          (code >= 97/*a*/ && code <= 102/*f*/))) {
                if (++encodeCheck === 3)
                  keyEncoded = true;
              } else {
                encodeCheck = 0;
              }
            }
          }
        }

        if (code === 43/*+*/) {
          if (eqIdx < eqLen) {
            if (i - lastPos > 0)
              key += qs.slice(lastPos, i);
            key += '%20';
            keyEncoded = true;
          } else {
            if (i - lastPos > 0)
              value += qs.slice(lastPos, i);
            value += '%20';
            valEncoded = true;
          }
          lastPos = i + 1;
        }
      }

      // Check if we have leftover key or value data
      if (pairs > 0 && (lastPos < qs.length || eqIdx > 0)) {
        if (lastPos < qs.length) {
          if (eqIdx < eqLen)
            key += qs.slice(lastPos);
          else if (sepIdx < sepLen)
            value += qs.slice(lastPos);
        }
        if (keyEncoded)
          key = decodeStr(key, decode);
        if (valEncoded)
          value = decodeStr(value, decode);

        if (keys.indexOf(key) === -1) {
          obj[key] = value;
          keys[keys.length] = key;
        } else {
          const curValue = obj[key];

          if (curValue instanceof Array)
            curValue[curValue.length] = value;
          else
            obj[key] = [curValue, value];
        }
      }

      return obj;
    };

    function decodeStr(s, decoder) {
      try {
        return decoder(s);
      } catch (e) {
        return QueryString.unescape(s, true);
      }
    }

    return QueryString;
})()

var pagination = $(".pagination");

var currentPage = parseInt(QueryString.parse(window.location.search.substr(1)).page);
if (!currentPage) {
    currentPage = 1;
}
var total = parseInt(pagination.attr("data-total"));
var template = $('<li><a href="javascript:void(0)"></a></li>');
var etcTemplate = $('<li><span>...</span></li>')

const generateDom = function(text, href, classes) {
    var newDom = template.clone();
    newDom.find("a").text(text).attr("href", href);
    if (classes) {
        newDom.attr("class", classes);
    }
    return newDom;
}
const generateUrl = function(page) {
    var search = QueryString.parse(window.location.search.substr(1));
    search.page = page;
    var result = window.location.pathname + "?" + QueryString.stringify(search);
    return result;
}

if (currentPage > 1) {
    pagination.append(generateDom("上一页", generateUrl(currentPage - 1)));
} else {
    pagination.append(generateDom("上一页", generateUrl(currentPage - 1), "disabled"));
}

if (currentPage > 2) {
    pagination.append(generateDom(1, generateUrl(1)));
}

if (currentPage > 3) {
    pagination.append(etcTemplate.clone());
}

if (currentPage > 1){
    pagination.append(generateDom(currentPage - 1, generateUrl(currentPage - 1)));
}

pagination.append(generateDom(currentPage, generateUrl(currentPage), "active"));

if (currentPage + 1 < total) {
    pagination.append(generateDom(currentPage + 1, generateUrl(currentPage + 1)));
}

if (currentPage + 2 < total) {
    pagination.append(etcTemplate.clone());
}

if (currentPage < total) {
    pagination.append(generateDom(total, generateUrl(total)));
}

if (currentPage < total) {
    pagination.append(generateDom("下一页", generateUrl(currentPage + 1)));
} else {
    pagination.append(generateDom("下一页", generateUrl(currentPage + 1), "disabled"));
}
