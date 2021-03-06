/*
  Module dependencies
*/

var ElementType = require('domelementtype');
var entities = require('entities');

var unencodedElements = {
  __proto__: null,
  style: true,
  script: true,
  xmp: true,
  iframe: true,
  noembed: true,
  noframes: true,
  plaintext: true,
  noscript: true
};

var chars = [
    "=",
    "{",
    "}",
    "(",
    ")",
    ".",
    ","
];

var ignorePrefix = /v-[\w]+|@[\w]+/gi;
var ignorePrefix_ = /:\w+/gi;

function testePropertyReact(str){
    return (str.length > 3 && str[0] === str[0].toLowerCase() && str[1] === str[1].toLowerCase() && str[2] === str[2].toUpperCase());
}
function verifyValue(str){
    for(let value in chars)
        if(str.indexOf(chars[value]) >= 0)
            return true;
    return false;
}
/*
  Format attributes
*/
function formatAttrs(attributes, opts) {
  if (!attributes) return;

  var output = '',
      value, propvue, isobj;

  let typecomponent = global.typecomponent;

  // Loop through the attributes
  for (var key in attributes) {
    value = attributes[key];
    if (output) {
      output += ' ';
    }

    typecomponent === "react" && key === "class" ? key = "className" : null;


    output += key;
    propvue = (ignorePrefix.test(key) || ignorePrefix_.test(key));
    isobj = (value.indexOf("{") === 0 && (verifyValue(value)));
    if(!propvue && isobj){

        output += '=' + (opts.decodeEntities ? entities.encodeXML(value) : value);

    }
    else if(verifyValue(key)){
        output += '' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '';
    }
    else if ((value !== null && value !== '') || opts.xmlMode) {

        output += '="' + (opts.decodeEntities ? entities.encodeXML(value) : value) + '"';
    }
  }

  return output;
}

/*
  Self-enclosing tags (stolen from node-htmlparser)
*/
var singleTag = {
  __proto__: null,
  area: true,
  base: true,
  basefont: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  frame: true,
  hr: true,
  img: true,
  input: true,
  isindex: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true,
};


var render = module.exports = function(dom, opts) {
  if (!Array.isArray(dom) && !dom.cheerio) dom = [dom];
  opts = opts || {};

  var output = '';

  for(var i = 0; i < dom.length; i++){
    var elem = dom[i];

    if (elem.type === 'root')
      output += render(elem.children, opts);
    else if (ElementType.isTag(elem))
      output += renderTag(elem, opts);
    else if (elem.type === ElementType.Directive)
      output += renderDirective(elem);
    else if (elem.type === ElementType.Comment)
      output += renderComment(elem);
    else if (elem.type === ElementType.CDATA)
      output += renderCdata(elem);
    else
      output += renderText(elem, opts);
  }

  return output;
};

function renderTag(elem, opts) {
  // Handle SVG
  if (elem.name === "svg") opts = {decodeEntities: opts.decodeEntities, xmlMode: true};

  var tag = '<' + elem.name,
      attribs = formatAttrs(elem.attribs, opts);

  if (attribs) {
    tag += ' ' + attribs;
  }

  if (
    opts.xmlMode
    && (!elem.children || elem.children.length === 0)
  ) {
    tag += '/>';
  } else {
    tag += '>';
    if (elem.children) {
      tag += render(elem.children, opts);
    }

    if (!singleTag[elem.name] || opts.xmlMode) {
      tag += '</' + elem.name + '>';
    }
  }

  return tag;
}

function renderDirective(elem) {
  return '<' + elem.data + '>';
}

function renderText(elem, opts) {
  var data = elem.data || '';

  // if entities weren't decoded, no need to encode them back
  if (opts.decodeEntities && !(elem.parent && elem.parent.name in unencodedElements)) {
    data = entities.encodeXML(data);
  }

  return data;
}

function renderCdata(elem) {
  return '<![CDATA[' + elem.children[0].data + ']]>';
}

function renderComment(elem) {
  return '<!--' + elem.data + '-->';
}
