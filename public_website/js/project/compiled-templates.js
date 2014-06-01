define(['handlebars.runtime'], function(Handlebars) {
  Handlebars = Handlebars["default"];  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['file-item'] = template({"compiler":[5,">= 2.0.0"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", escapeExpression=this.escapeExpression;
  return "<li class='navItemFile' data-itemId='"
    + escapeExpression(((helper = helpers.id || (depth0 && depth0.id)),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "'>\n	<a href='#'>\n		<div class='navItemInner1'><img src='images/icon_file.png'/></div>\n		<div class='navItemInner2'>"
    + escapeExpression(((helper = helpers.title || (depth0 && depth0.title)),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</div>\n	</a>\n</li>";
},"useData":true});
templates['folder-item'] = template({"compiler":[5,">= 2.0.0"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", escapeExpression=this.escapeExpression;
  return "<li class='navItemFolder' data-itemId='"
    + escapeExpression(((helper = helpers.id || (depth0 && depth0.id)),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "'>\n	<a href='#'>\n		<div class='navItemInner1'>\n		<img class='arrowRight' src='images/icon_folder_arrow_right.png'/><img class='arrowDown' src='images/icon_folder_arrow_down.png'/><img src='images/icon_folder_gray.png'/>\n		</div>\n		<div class='navItemInner2'>"
    + escapeExpression(((helper = helpers.title || (depth0 && depth0.title)),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</div>\n	</a>\n</li>";
},"useData":true});
return templates;
});