Formbuilder.registerField 'map',
  repeatable: true
  valueField: false
  view: """
    <h1><span class='icon-map-marker'></span></h1>
  """
  edit: """"""

  addButton: """
    <span class='symbol'><span class='icon-map-marker'></span></span> Map
  """

  defaultAttributes: (attrs) ->
    attrs
