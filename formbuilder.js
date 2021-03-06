(function() {
  rivets.binders.input = {
    publishes: true,
    routine: rivets.binders.value.routine,
    bind: function(el) {
      return el.addEventListener('input', this.publish);
    },
    unbind: function(el) {
      return el.removeEventListener('input', this.publish);
    }
  };

  rivets.configure({
    prefix: "rv",
    adapter: {
      subscribe: function(obj, keypath, callback) {
        callback.wrapped = function(m, v) {
          return callback(v);
        };
        return obj.on('change:' + keypath, callback.wrapped);
      },
      unsubscribe: function(obj, keypath, callback) {
        return obj.off('change:' + keypath, callback.wrapped);
      },
      read: function(obj, keypath) {
        if (keypath === "cid") {
          return obj.cid;
        }
        return obj.get(keypath);
      },
      publish: function(obj, keypath, value) {
        if (obj.cid) {
          return obj.set(keypath, value);
        } else {
          return obj[keypath] = value;
        }
      }
    }
  });

  rivets.formatters.number = {
    read: function(value) {
      if (value && value !== '') {
        return parseInt(value);
      } else {
        return void 0;
      }
    },
    publish: function(value) {
      if (value && value !== '') {
        return parseInt(value);
      } else {
        return void 0;
      }
    }
  };

}).call(this);

(function() {
  var Formbuilder;

  Formbuilder = (function() {
    Formbuilder.helpers = {
      defaultFieldAttrs: function(field_type) {
        var attrs, _base;
        if (Formbuilder.options.mappings.TYPE_ALIASES && Formbuilder.options.mappings.TYPE_ALIASES[field_type]) {
          field_type = Formbuilder.options.mappings.TYPE_ALIASES[field_type];
        }
        attrs = {};
        attrs[Formbuilder.options.mappings.FIELD_OPTIONS] = {};
        attrs[Formbuilder.options.mappings.REQUIRED] = true;
        attrs[Formbuilder.options.mappings.REPEATING] = false;
        attrs[Formbuilder.options.mappings.FIELD_TYPE] = field_type;
        attrs[Formbuilder.options.mappings.LABEL] = "Untitled";
        attrs[Formbuilder.options.mappings.VALIDATE_IMMEDIATELY] = true;
        attrs[Formbuilder.options.mappings.ADMIN_ONLY] = false;
        attrs[Formbuilder.options.mappings.FIELD_CODE] = null;
        return (typeof (_base = Formbuilder.fields[field_type]).defaultAttributes === "function" ? _base.defaultAttributes(attrs) : void 0) || attrs;
      },
      simple_format: function(x) {
        return x != null ? x.replace(/\n/g, '<br />') : void 0;
      }
    };

    Formbuilder.options = {
      BUTTON_CLASS: 'fb-button',
      HTTP_ENDPOINT: '',
      HTTP_METHOD: 'POST',
      mappings: {
        SIZE: 'field_options.size',
        UNITS: 'field_options.units',
        LABEL: 'label',
        VALUE: 'value',
        HASH: 'hash',
        FIELD_TYPE: 'field_type',
        REQUIRED: 'required',
        REPEATING: 'repeating',
        VALIDATE_IMMEDIATELY: 'validate_immediately',
        ADMIN_ONLY: 'adminOnly',
        FIELD_CODE: 'fieldCode',
        FIELD_OPTIONS: 'field_options',
        OPTIONS: 'field_options.options',
        DESCRIPTION: 'field_options.description',
        DESCRIPTION_PLACEHOLDER: 'Add a longer description to this field',
        DESCRIPTION_TITLE: 'Description',
        INCLUDE_OTHER: 'field_options.include_other_option',
        INCLUDE_BLANK: 'field_options.include_blank_option',
        DATASOURCE: 'dataSource',
        DATASOURCE_TYPE: 'dataSourceType',
        DATASOURCE_TYPE_DATASOURCE: 'dataSource',
        DATASOURCE_TYPE_STATIC: 'static',
        INTEGER_ONLY: 'field_options.integer_only',
        LOCATION_UNIT: 'field_options.location_unit',
        DATETIME_UNIT: 'field_options.datetime_unit',
        DATETIME_FORMAT: 'field_options.definition.dateTimeFormat',
        MIN: 'field_options.min',
        MAX: 'field_options.max',
        STEP_SIZE: 'field_options.stepSize',
        MINLENGTH: 'field_options.minlength',
        MAXLENGTH: 'field_options.maxlength',
        MINREPITIONS: 'field_options.minRepeat',
        MAXREPITIONS: 'field_options.maxRepeat',
        LENGTH_UNITS: 'field_options.min_max_length_units',
        FILE_SIZE: 'field_options.file_size',
        FIELD_FORMAT_MODE: 'field_options.field_format_mode',
        FIELD_FORMAT_STRING: 'field_options.field_format_string',
        PHOTO_HEIGHT: 'field_options.photo_height',
        PHOTO_WIDTH: 'field_options.photo_width',
        PHOTO_QUALITY: 'field_options.photo_quality',
        SINGLE_CHECKED: 'field_options.checked',
        TIME_AUTOPOPULATE: 'field_options.time_autopopulate',
        VALUE_HEADER: 'Value',
        TYPE_ALIASES: false,
        FIELD_ERROR: 'field_error'
      },
      unAliasType: function(type) {
        var $idx;
        if (Formbuilder.options.mappings.TYPE_ALIASES) {
          $idx = _.values(Formbuilder.options.mappings.TYPE_ALIASES).indexOf(type);
          if ($idx > -1) {
            type = _.keys(Formbuilder.options.mappings.TYPE_ALIASES)[$idx];
          }
        }
        return type;
      },
      dict: {
        ALL_CHANGES_SAVED: 'All changes saved',
        SAVE_FORM: 'Save form',
        UNSAVED_CHANGES: 'You have unsaved changes. If you leave this page, you will lose those changes!'
      }
    };

    Formbuilder.fields = {};

    Formbuilder.inputFields = {};

    Formbuilder.nonInputFields = {};

    Formbuilder.fieldRuleConfirmationFunction = function(field, cb) {
      return typeof cb === "function" ? cb(true) : void 0;
    };

    Formbuilder.model = Backbone.DeepModel.extend({
      sync: function() {},
      indexInDOM: function() {
        var $wrapper;
        $wrapper = $(".fb-field-wrapper").filter(((function(_this) {
          return function(_, el) {
            return $(el).data('cid') === _this.cid;
          };
        })(this)));
        return $(".fb-field-wrapper").index($wrapper);
      },
      is_input: function() {
        var $type;
        $type = this.get(Formbuilder.options.mappings.FIELD_TYPE);
        $type = Formbuilder.options.unAliasType($type);
        return Formbuilder.inputFields[$type] != null;
      }
    });

    Formbuilder.collection = Backbone.Collection.extend({
      initialize: function() {
        return this.on('add', this.copyCidToModel);
      },
      model: Formbuilder.model,
      comparator: function(model) {
        return model.indexInDOM();
      },
      copyCidToModel: function(model) {
        return model.attributes.cid = model.cid;
      }
    });

    Formbuilder.registerField = function(name, opts) {
      var x, _i, _len, _ref;
      _ref = ['view', 'edit'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        x = _ref[_i];
        opts[x] = _.template(opts[x]);
      }
      Formbuilder.fields[name] = opts;
      if (opts.type === 'non_input') {
        return Formbuilder.nonInputFields[name] = opts;
      } else {
        return Formbuilder.inputFields[name] = opts;
      }
    };

    Formbuilder.registerFieldRuleConfirmation = function(fn) {
      return Formbuilder.fieldRuleConfirmationFunction = fn;
    };

    Formbuilder.views = {
      view_field: Backbone.View.extend({
        className: "fb-field-wrapper",
        events: {
          'click .subtemplate-wrapper': 'focusEditView',
          'click .js-duplicate': 'duplicate',
          'click .js-clear': 'clear',
          'keyup input': 'forceEditRender',
          'keyup textarea': 'forceEditRender',
          'change input[type=file]': 'forceEditRender'
        },
        initialize: function() {
          this.parentView = this.options.parentView;
          this.listenTo(this.model, "change", this.render);
          return this.listenTo(this.model, "destroy", this.remove);
        },
        render: function() {
          var $type, editStructure;
          if (this.editing) {
            delete this.editing;
            return;
          }
          editStructure = this.parentView.options.hasOwnProperty('editStructure') ? this.parentView.options.editStructure : true;
          $type = this.model.get(Formbuilder.options.mappings.FIELD_TYPE);
          if (this.model.get(Formbuilder.options.mappings.ADMIN_ONLY)) {
            Formbuilder.fieldRuleConfirmationFunction(this.model, "adminChange", "Admin Only fields cannot be the subject of rules. Changing this field to Admin Only will remove any references of this field from page/field rules. Do you wish to keep the updated rules?");
            this.$el.addClass('admin-field');
          } else {
            this.$el.removeClass('admin-field');
          }
          if (Formbuilder.options.mappings.TYPE_ALISES) {
            $type = Formbuilder.options.mappings.TYPE_ALISES[$type];
          }
          this.$el.addClass('response-field-' + $type).data('cid', this.model.cid).html(Formbuilder.templates["view/base" + (!this.model.is_input() ? '_non_input' : '')]({
            editStructure: editStructure,
            rf: this.model
          }));
          return this;
        },
        focusEditView: function(e) {
          return this.parentView.createAndShowEditView(this.model);
        },
        forceEditRender: function(e) {
          var val;
          val = e.target.value;
          this.editing = true;
          this.model.set(Formbuilder.options.mappings.VALUE, val);
        },
        clear: function() {
          this.parentView.handleFormUpdate();
          return Formbuilder.fieldRuleConfirmationFunction(this.model, "deleteChange", "Deleting this field will remove any references of this field from page/field rules. Do you wish to keep the updated rules?", (function(_this) {
            return function(confirmed) {
              return _this.model.destroy();
            };
          })(this));
        },
        duplicate: function() {
          var attrs;
          attrs = _.clone(this.model.attributes);
          delete attrs['id'];
          attrs[Formbuilder.options.mappings.LABEL] += ' Copy';
          return this.parentView.createField(attrs, {
            position: this.model.indexInDOM() + 1
          });
        }
      }),
      edit_field: Backbone.View.extend({
        className: "edit-response-field",
        events: {
          'click .js-add-option': 'addOption',
          'click .js-remove-option': 'removeOption',
          'click .js-default-updated': 'defaultUpdated',
          'input .option-label-input': 'forceRender',
          'change .fb-repeating input[type=checkbox]': 'toggleRepititionsInputs',
          'change .fieldFormatMode': 'changeFieldFormatHelpText',
          'change .fb-required input[type=checkbox]': 'requiredChanged',
          'change .includeDataSource input[type=checkbox]': 'toggleDSView',
          'change .ds-select': 'onDSSelect',
          'change .datetype': 'toggleDateFormat'
        },
        initialize: function() {
          this.listenTo(this.model, "destroy", this.remove);
          return this.parentView = this.options.parentView;
        },
        render: function() {
          var $dsSelect, $repeatable, $type, commonCheckboxes;
          commonCheckboxes = this.parentView.options.hasOwnProperty('commonCheckboxes') ? this.parentView.options.commonCheckboxes : true;
          $repeatable = false;
          $type = this.model.get(Formbuilder.options.mappings.FIELD_TYPE);
          $type = Formbuilder.options.unAliasType($type);
          if (Formbuilder.inputFields[$type] && Formbuilder.inputFields[$type].repeatable && Formbuilder.inputFields[$type].repeatable === true) {
            $repeatable = true;
          }
          this.$el.html(Formbuilder.templates["edit/base" + (!this.model.is_input() ? '_non_input' : '')]({
            rf: this.model,
            editStructure: this.parentView.options.editStructure,
            commonCheckboxes: commonCheckboxes,
            repeatable: $repeatable,
            repeating: this.model.get(Formbuilder.options.mappings.REPEATING)
          }));
          $dsSelect = this.$el.find('.ds-dd select');
          if ($dsSelect) {
            $dsSelect.html(Formbuilder.templates["partials/ds_options"]({
              datasources: this.parentView.options.datasources,
              datasource: this.model.get(Formbuilder.options.mappings.DATASOURCE)
            }));
          }
          rivets.bind(this.$el, {
            model: this.model
          });
          this.toggleDateFormat();
          return this;
        },
        remove: function() {
          this.options.parentView.editView = void 0;
          this.options.parentView.$el.find("[href=\"#addField\"]").click();
          return Backbone.View.prototype.remove.call(this);
        },
        addOption: function(e) {
          var $el, i, newOption, options;
          $el = $(e.currentTarget);
          i = this.$el.find('.option').index($el.closest('.option'));
          options = this.model.get(Formbuilder.options.mappings.OPTIONS) || [];
          newOption = {
            checked: false
          };
          newOption[Formbuilder.options.mappings.LABEL] = "";
          if (i > -1) {
            options.splice(i + 1, 0, newOption);
          } else {
            options.push(newOption);
          }
          this.model.set(Formbuilder.options.mappings.OPTIONS, options);
          this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
          return this.forceRender();
        },
        removeOption: function(e) {
          var $el, index, options;
          $el = $(e.currentTarget);
          index = this.$el.find(".js-remove-option").index($el);
          options = this.model.get(Formbuilder.options.mappings.OPTIONS);
          options.splice(index, 1);
          this.model.set(Formbuilder.options.mappings.OPTIONS, options);
          this.model.trigger("change:" + Formbuilder.options.mappings.OPTIONS);
          return this.forceRender();
        },
        defaultUpdated: function(e) {
          var $checkboxType, $el;
          $el = $(e.currentTarget);
          $checkboxType = 'checkboxes';
          if (Formbuilder.options.mappings.TYPE_ALIASES && Formbuilder.options.mappings.TYPE_ALIASES['checkboxes']) {
            $checkboxType = Formbuilder.options.mappings.TYPE_ALIASES['checkboxes'];
          }
          if (this.model.get(Formbuilder.options.mappings.FIELD_TYPE) !== $checkboxType) {
            this.$el.find(".js-default-updated").not($el).attr('checked', false).trigger('change');
          }
          return this.forceRender();
        },
        forceRender: function() {
          return this.model.trigger('change', this.model);
        },
        toggleDSView: function(e) {
          var $dataSourceTableView, $el, $optionWrapper, $select;
          $el = $(e.target);
          $select = this.$el.find('.ds-dd select');
          $optionWrapper = this.$el.find('.option-wrapper');
          $dataSourceTableView = this.$el.find('.datasource-data-view');
          if ($el.prop('checked') === true) {
            $select.prop('disabled', false);
            this.model.set(Formbuilder.options.mappings.DATASOURCE_TYPE, Formbuilder.options.mappings.DATASOURCE_TYPE_DATASOURCE);
            $optionWrapper.addClass('hidden');
            return $dataSourceTableView.removeClass('hidden');
          } else {
            $select.prop('disabled', true);
            this.model.set(Formbuilder.options.mappings.DATASOURCE_TYPE, Formbuilder.options.mappings.DATASOURCE_TYPE_STATIC);
            $optionWrapper.removeClass('hidden');
            return $dataSourceTableView.addClass('hidden');
          }
        },
        onDSSelect: function(e) {
          var $dsId, $el;
          $el = $(e.target);
          $dsId = $el.val();
          if ($dsId !== 'prompt') {
            this.model.set(Formbuilder.options.mappings.DATASOURCE, $dsId);
            return this.model.set(Formbuilder.options.mappings.DATASOURCE_TYPE, Formbuilder.options.mappings.DATASOURCE_TYPE_DATASOURCE);
          }
        },
        toggleRepititionsInputs: function(e) {
          var $el, $max, $min;
          $el = $(e.target);
          if ($el.prop('checked') === true) {
            this.$el.find('.fb-repititions input').prop('disabled', false);
            $min = this.$el.find('.fb-repititions input.minReps');
            $max = this.$el.find('.fb-repititions input.maxReps');
            if ($min.val() === "") {
              this.model.set(Formbuilder.options.mappings.MINREPITIONS, 1);
            }
            if ($max.val() === "") {
              this.model.set(Formbuilder.options.mappings.MAXREPITIONS, 5);
            }
            return this.model.set(Formbuilder.options.mappings.REQUIRED, true);
          } else {
            return this.$el.find('.fb-repititions input').prop('disabled', true);
          }
        },
        changeFieldFormatHelpText: function(e) {
          var $value;
          $value = $(e.target).val();
          if ($value === "regex") {
            this.$el.find('.simpleFormat').hide();
            return this.$el.find('.advancedFormat').show();
          } else {
            this.$el.find('.simpleFormat').show();
            return this.$el.find('.advancedFormat').hide();
          }
        },
        requiredChanged: function(e) {
          var $checkboxType, $el;
          $el = $(e.target);
          $checkboxType = 'checkboxes';
          if (Formbuilder.options.mappings.TYPE_ALIASES && Formbuilder.options.mappings.TYPE_ALIASES[$checkboxType]) {
            $checkboxType = Formbuilder.options.mappings.TYPE_ALIASES['checkboxes'];
          }
          if (this.model.get(Formbuilder.options.mappings.FIELD_TYPE) === $checkboxType) {
            this.render();
            if ($el.prop('checked') === false) {
              this.model.unset(Formbuilder.options.mappings.MIN);
              return this.model.unset(Formbuilder.options.mappings.MAX);
            } else {
              return this.model.set(Formbuilder.options.mappings.MIN, 1);
            }
          }
        },
        toggleDateFormat: function(e) {
          var dateFormatElements;
          dateFormatElements = this.$el.find('.dateformat');
          if (this.model.get(Formbuilder.options.mappings.DATETIME_UNIT) !== 'datetime') {
            return dateFormatElements.each(function() {
              return $(this).hide();
            });
          } else {
            return dateFormatElements.each(function() {
              return $(this).show();
            });
          }
        }
      }),
      main: Backbone.View.extend({
        SUBVIEWS: [],
        events: {
          'click .js-save-form': 'saveForm',
          'click .fb-add-field-types a': 'addField',
          'blur input.minReps': 'checkReps',
          'blur input.maxReps': 'checkReps'
        },
        initialize: function() {
          if (!this.options.eventFix) {
            this.events['click .fb-tabs a'] = 'showTab';
          }
          this.$el = $(this.options.selector);
          this.formBuilder = this.options.formBuilder;
          this.collection = new Formbuilder.collection;
          this.collection.bind('add', this.addOne, this);
          this.collection.bind('reset', this.reset, this);
          this.collection.bind('change', this.handleFormUpdate, this);
          this.collection.bind('destroy add reset', this.hideShowNoResponseFields, this);
          this.collection.bind('destroy', this.ensureEditViewScrolled, this);
          this.render();
          this.collection.reset(this.options.bootstrapData);
          return this.initAutosave();
        },
        initAutosave: function() {
          this.formSaved = true;
          this.saveFormButton = this.$el.find(".js-save-form");
          this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
          setInterval((function(_this) {
            return function() {
              return _this.saveForm.call(_this);
            };
          })(this), 5000);
          return $(window).bind('beforeunload', (function(_this) {
            return function() {
              if (_this.formSaved) {
                return void 0;
              } else {
                return Formbuilder.options.dict.UNSAVED_CHANGES;
              }
            };
          })(this));
        },
        reset: function() {
          this.$responseFields.html('');
          return this.addAll();
        },
        render: function() {
          var $fields, $fieldsNonInput, alias, field, fieldName, orig, subview, _i, _j, _len, _len1, _ref, _ref1, _ref2;
          this.options.editStructure = this.options.hasOwnProperty('editStructure') ? this.options.editStructure : true;
          this.options.addAt = this.options.hasOwnProperty('addAt') ? this.options.addAt : 'last';
          if (Formbuilder.options.mappings.TYPE_ALIASES) {
            _ref = Formbuilder.options.mappings.TYPE_ALIASES;
            for (orig in _ref) {
              alias = _ref[orig];
              Formbuilder.fields[alias] = Formbuilder.fields[orig];
            }
          }
          $fields = {};
          $fieldsNonInput = {};
          if (this.options.hasOwnProperty('fields')) {
            _ref1 = this.options.fields;
            for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
              fieldName = _ref1[_i];
              field = Formbuilder.inputFields[fieldName] || Formbuilder.nonInputFields[fieldName];
              if (!field) {
                throw new Error("No field found with name" + fieldName);
              }
              if (field.type === "non_input") {
                $fieldsNonInput[fieldName] = field;
              } else {
                $fields[fieldName] = field;
              }
            }
          } else {
            $fields = Formbuilder.inputFields;
            $fieldsNonInput = Formbuilder.nonInputFields;
          }
          this.$el.html(Formbuilder.templates['page']({
            editStructure: this.options.editStructure,
            fieldsEnabled: $fields,
            fieldsEnabledNonInput: $fieldsNonInput
          }));
          this.$fbLeft = this.$el.find('.fb-left') || this.$el.find('.span6.middle');
          this.$fbRight = this.$el.find('.fb-right') || this.$el.find('.span4.right');
          this.$responseFields = this.$el.find('.fb-response-fields');
          this.bindWindowScrollEvent();
          this.hideShowNoResponseFields();
          _ref2 = this.SUBVIEWS;
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            subview = _ref2[_j];
            new subview({
              parentView: this
            }).render();
          }
          if (this.options.eventFix) {
            this.$el.find('.fb-tabs a').unbind().click(this.showTab);
          }
          return this;
        },
        bindWindowScrollEvent: function() {
          return $(window).on('scroll', (function(_this) {
            return function() {
              var maxMargin, newMargin;
              if (_this.$fbLeft.data('locked') === true) {
                return;
              }
              newMargin = Math.max(0, $(window).scrollTop());
              maxMargin = _this.$responseFields.height();
              return _this.$fbLeft.css({
                'margin-top': Math.min(maxMargin, newMargin)
              });
            };
          })(this));
        },
        showTab: function(e) {
          var $el, first_model, target;
          $el = $(e.currentTarget);
          target = $el.data('target');
          $el.closest('li').addClass('active').siblings('li').removeClass('active');
          this.$el.find(target).addClass('active').siblings('.fb-tab-pane').removeClass('active');
          if (target !== '#editField') {
            this.unlockLeftWrapper();
          }
          if (target === '#editField' && !this.editView && (first_model = this.collection.models[0])) {
            return this.createAndShowEditView(first_model);
          }
        },
        addOne: function(responseField, _, options) {
          var $replacePosition, view;
          view = new Formbuilder.views.view_field({
            model: responseField,
            parentView: this
          });
          if (options.$replaceEl != null) {
            return options.$replaceEl.replaceWith(view.render().el);
          } else if ((options.position == null) || options.position === -1) {
            return this.$responseFields.append(view.render().el);
          } else if (options.position === 0) {
            return this.$responseFields.prepend(view.render().el);
          } else if (($replacePosition = this.$responseFields.find(".fb-field-wrapper").eq(options.position))[0]) {
            return $replacePosition.before(view.render().el);
          } else {
            return this.$responseFields.append(view.render().el);
          }
        },
        setSortable: function() {
          if (this.$responseFields.hasClass('ui-sortable')) {
            this.$responseFields.sortable('destroy');
          }
          this.$responseFields.sortable({
            forcePlaceholderSize: true,
            placeholder: 'sortable-placeholder',
            cancel: '.fb-field-wrapper.response-field-page_break',
            stop: (function(_this) {
              return function(e, ui) {
                var rf;
                if (ui.item.data('field-type')) {
                  rf = _this.collection.create(Formbuilder.helpers.defaultFieldAttrs(ui.item.data('field-type')), {
                    $replaceEl: ui.item
                  });
                  _this.createAndShowEditView(rf);
                }
                if (ui.item.is('div:first-of-type')) {
                  _this.$responseFields.sortable('cancel');
                }
                _this.handleFormUpdate();
                _this.trigger('reorder');
                return true;
              };
            })(this),
            update: (function(_this) {
              return function(e, ui) {
                if (!ui.item.data('field-type')) {
                  return _this.ensureEditViewScrolled();
                }
              };
            })(this)
          });
          return this.setDraggable();
        },
        setDraggable: function() {
          var $addFieldButtons;
          $addFieldButtons = this.$el.find("[data-field-type]");
          return $addFieldButtons.draggable({
            connectToSortable: this.$responseFields,
            start: (function(_this) {
              return function() {
                return _this.$responseFields.sortable("refresh");
              };
            })(this),
            helper: (function(_this) {
              return function() {
                var $helper;
                $helper = $("<div class='response-field-draggable-helper' />");
                $helper.css({
                  width: _this.$responseFields.width(),
                  height: '80px'
                });
                return $helper;
              };
            })(this)
          });
        },
        addAll: function() {
          this.collection.each(this.addOne, this);
          if (!(this.options.editStructure === false)) {
            return this.setSortable();
          }
        },
        hideShowNoResponseFields: function() {
          return this.$el.find(".fb-no-response-fields")[this.collection.length > 0 ? 'hide' : 'show']();
        },
        addField: function(e) {
          var field_type;
          field_type = $(e.currentTarget).data('field-type');
          return this.createField(Formbuilder.helpers.defaultFieldAttrs(field_type));
        },
        createField: function(attrs, options) {
          var rf;
          options = options || {};
          options.at = this.options.addAt === "last" ? this.collection.length : 0;
          rf = this.collection.create(attrs, options);
          this.createAndShowEditView(rf);
          return this.handleFormUpdate();
        },
        createAndShowEditView: function(model) {
          var $newEditEl, $responseFieldEl, oldPadding;
          $responseFieldEl = this.$el.find(".fb-field-wrapper").filter(function() {
            return $(this).data('cid') === model.cid;
          });
          $responseFieldEl.addClass('editing').siblings('.fb-field-wrapper').removeClass('editing');
          if (this.editView) {
            if (this.editView.model.cid === model.cid) {
              this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
              this.scrollLeftWrapper($responseFieldEl, (typeof oldPadding !== "undefined" && oldPadding !== null) && oldPadding);
              return;
            }
            oldPadding = this.$fbLeft.css('padding-top');
            this.editView.remove();
          }
          this.editView = new Formbuilder.views.edit_field({
            model: model,
            parentView: this
          });
          $newEditEl = this.editView.render().$el;
          this.$el.find(".fb-edit-field-wrapper").html($newEditEl);
          if (!this.options.noEditOnDrop) {
            this.$el.find(".fb-tabs a[data-target=\"#editField\"]").click();
          }
          this.scrollLeftWrapper($responseFieldEl);
          return this;
        },
        checkReps: function(e) {
          var $active, $maxRep, $maxVal, $minRep, $minVal, $parent, $target;
          $target = $(e.target);
          $active = $target.hasClass('maxReps') === true ? 'max' : 'min';
          $parent = $target.parent();
          $maxRep = $target.parent().find('input.maxReps');
          $minRep = $target.parent().find('input.minReps');
          $minVal = Number($minRep.val());
          $maxVal = Number($maxRep.val());
          if ($active === 'min') {
            if ($minVal && $minVal < 0 || $minVal > $maxVal) {
              $minRep.addClass('error');
            } else {
              $minRep.removeClass('error');
            }
            return $minRep.val(parseInt($minVal));
          } else {
            if ($maxVal && $maxVal < 0 || $minVal > $maxVal) {
              $maxRep.addClass('error');
            } else {
              $maxRep.removeClass('error');
            }
            return $maxRep.val(parseInt($maxVal));
          }
        },
        ensureEditViewScrolled: function() {
          if (!this.editView) {
            return;
          }
          return this.scrollLeftWrapper($(".fb-field-wrapper.editing"));
        },
        scrollLeftWrapper: function($responseFieldEl) {
          if (this.options.noScroll) {
            return;
          }
          this.unlockLeftWrapper();
          return $.scrollWindowTo($responseFieldEl.offset().top - this.$responseFields.offset().top, 200, (function(_this) {
            return function() {
              return _this.lockLeftWrapper();
            };
          })(this));
        },
        lockLeftWrapper: function() {
          return this.$fbLeft.data('locked', true);
        },
        unlockLeftWrapper: function() {
          return this.$fbLeft.data('locked', false);
        },
        handleFormUpdate: function() {
          if (this.updatingBatch) {
            return;
          }
          this.formSaved = false;
          return this.saveFormButton.removeAttr('disabled').text(Formbuilder.options.dict.SAVE_FORM);
        },
        saveForm: function(e) {
          var payload;
          if (this.formSaved) {
            return;
          }
          this.formSaved = true;
          this.saveFormButton.attr('disabled', true).text(Formbuilder.options.dict.ALL_CHANGES_SAVED);
          this.collection.sort();
          payload = JSON.stringify({
            fields: this.collection.toJSON()
          });
          if (Formbuilder.options.HTTP_ENDPOINT) {
            this.doAjaxSave(payload);
          }
          return this.formBuilder.trigger('save', payload);
        },
        doAjaxSave: function(payload) {
          return $.ajax({
            url: Formbuilder.options.HTTP_ENDPOINT,
            type: Formbuilder.options.HTTP_METHOD,
            data: payload,
            contentType: "application/json",
            success: (function(_this) {
              return function(data) {
                var datum, _i, _len, _ref;
                _this.updatingBatch = true;
                for (_i = 0, _len = data.length; _i < _len; _i++) {
                  datum = data[_i];
                  if ((_ref = _this.collection.get(datum.cid)) != null) {
                    _ref.set({
                      id: datum.id
                    });
                  }
                  _this.collection.trigger('sync');
                }
                return _this.updatingBatch = void 0;
              };
            })(this)
          });
        }
      })
    };

    function Formbuilder(selector, opts) {
      if (opts == null) {
        opts = {};
      }
      _.extend(this, Backbone.Events);
      this.mainView = new Formbuilder.views.main(_.extend({
        selector: selector
      }, opts, {
        formBuilder: this
      }));
      this.collection = this.mainView.collection;
    }

    return Formbuilder;

  })();

  window.Formbuilder = Formbuilder;

  if (typeof module !== "undefined" && module !== null) {
    module.exports = Formbuilder;
  } else {
    window.Formbuilder = Formbuilder;
  }

}).call(this);

(function() {
  Formbuilder.registerField('address', {
    repeatable: true,
    view: "<div class='input-line'>\n  <span class='street'>\n    <input type='text' />\n    <label>Address</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='city'>\n    <input type='text' />\n    <label>City</label>\n  </span>\n\n  <span class='state'>\n    <input type='text' />\n    <label>State / Province / Region</label>\n  </span>\n</div>\n\n<div class='input-line'>\n  <span class='zip'>\n    <input type='text' />\n    <label>Zipcode</label>\n  </span>\n\n  <span class='country'>\n    <select><option>United States</option></select>\n    <label>Country</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-home\"></span></span> Address"
  });

}).call(this);

(function() {
  Formbuilder.registerField('autodate', {
    icon: 'icon-calendar',
    repeatable: true,
    valueField: false,
    view: "<% if (rf.get(Formbuilder.options.mappings.DATETIME_UNIT)===\"date\"){ %>\n  <input disabled value=\"YYYY-MM-DD\">\n  <span class='icon icon-calendar'></span>\n<% } else if (rf.get(Formbuilder.options.mappings.DATETIME_UNIT)===\"time\"){ %>\n  <input disabled value=\"HH:MM\">\n  <span class='icon icon-time'></span>\n<% }else{ %>\n  <input disabled value=\"<%= rf.get(Formbuilder.options.mappings.DATETIME_FORMAT) || 'YYYY-MM-DD HH:mm:ss' %>\">\n  <span class='icon icon-calendar'></span><span class='icon icon-time'></span>\n\n<% } %>",
    edit: "        <div class='fb-edit-section-header'>Date Stamp Options</div>\n        <div class=\"inline-labels\">\n          <label>Field type:</label>\n          <select class=\"datetype\" data-rv-value=\"model.<%= Formbuilder.options.mappings.DATETIME_UNIT %>\">\n            <option value=\"datetime\">Date &amp; Time</option>\n            <option value=\"time\">Time Only</option>\n            <option value=\"date\">Date Only</option>\n          </select>\n<div class=\"dateformat\">\n          <label>Format:</label>\n          <input type=\"text\" data-rv-value=\"model.<%= Formbuilder.options.mappings.DATETIME_FORMAT %>\"/>\n<div>\n        </div>",
    addButton: "<span class='symbol'><span class='icon-calendar'></span></span> Datestamp",
    defaultAttributes: function(attrs) {
      attrs[Formbuilder.options.mappings.DATETIME_UNIT] = 'datetime';
      attrs[Formbuilder.options.mappings.DATETIME_FORMAT] = 'YYYY-MM-DD HH:mm:ss';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('barcode', {
    icon: 'icon-barcode',
    repeatable: true,
    valueField: false,
    view: "<label>Value: </label><input type='number' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>'  /><br/>\n<label>Format: </label><input type='number' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>' />",
    edit: "",
    addButton: "<span class='symbol'><span class='icon-barcode'></span></span> Barcode",
    defaultAttributes: function(attrs) {
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('checkbox', {
    repeatable: true,
    icon: 'icon-check',
    valueField: false,
    view: "<input type='checkbox' <%= rf.get(Formbuilder.options.mappings.SINGLE_CHECKED) && 'checked' %> onclick=\"javascript: return false;\" />",
    edit: "<div class='fb-edit-section-header'>Checked</div>\n<input type='checkbox' <%= rf.get(Formbuilder.options.mappings.SINGLE_CHECKED) && 'checked' %> data-rv-checked='model.<%= Formbuilder.options.mappings.SINGLE_CHECKED%>' />",
    addButton: "<span class=\"symbol\"><span class=\"icon-check\"></span></span> Checkbox",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.SINGLE_CHECKED, true);
      attrs.set(Formbuilder.options.mappings.FIELD_TYPE, 'checkbox');
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('checkboxes', {
    repeatable: false,
    valueField: false,
    icon: 'icon-check',
    view: "<% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='checkbox' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> onclick=\"javascript: return false;\" />\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input type='checkbox' />\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/min_max_options']({ rf : rf }) %>\n<%= Formbuilder.templates['edit/options']({includeDatasource: true, rf: rf}) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-check\"></span></span> Checkboxes",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.FIELD_TYPE, 'checkboxes');
      attrs.set(Formbuilder.options.mappings.MIN, 1);
      attrs.set(Formbuilder.options.mappings.OPTIONS, [
        {
          label: "Option 1",
          checked: false
        }, {
          label: "Option 2",
          checked: false
        }
      ]);
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('date', {
    repeatable: true,
    view: "<div class='input-line'>\n  <span class='month'>\n    <input type=\"text\" />\n    <label>MM</label>\n  </span>\n\n  <span class='above-line'>/</span>\n\n  <span class='day'>\n    <input type=\"text\" />\n    <label>DD</label>\n  </span>\n\n  <span class='above-line'>/</span>\n\n  <span class='year'>\n    <input type=\"text\" />\n    <label>YYYY</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-calendar\"></span></span> Date"
  });

}).call(this);

(function() {
  Formbuilder.registerField('dropdown', {
    repeatable: true,
    valueField: false,
    icon: 'icon-caret-down',
    view: "<select>\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_BLANK)) { %>\n    <option value=''></option>\n  <% } %>\n\n  <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n    <option <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'selected' %>>\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </option>\n  <% } %>\n</select>",
    edit: "<%= Formbuilder.templates['edit/options']({ includeBlank: true, includeDatasource: true, rf: rf}) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-caret-down\"></span></span> Dropdown",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.FIELD_TYPE, 'dropdown');
      attrs.set(Formbuilder.options.mappings.OPTIONS, [
        {
          label: "Option 1",
          checked: false
        }, {
          label: "Option 2",
          checked: false
        }
      ]);
      attrs.set(Formbuilder.options.mappings.INCLUDE_BLANK, false);
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('email', {
    repeatable: true,
    icon: 'icon-envelope-alt',
    view: "<input type='text' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>'  value='<%= rf.get(Formbuilder.options.mappings.VALUE) %>' placeholder=\"email@example.com\" class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-envelope-alt\"></span></span> Email"
  });

}).call(this);

(function() {
  Formbuilder.registerField('list', {
    icon: 'icon-list',
    type: 'non_input',
    view: "<div class=\"btn-group pull-right\">\n<a data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\" class=\"btn btn-small btn-listfield-data\" href=\"#\"><i class=\"icon-pencil\"></i> Edit Data</a>\n<a data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\" class=\"btn btn-small btn-listfield-structure\" href=\"#\"><i class=\"icon-road\"></i> Edit Structure</i></a>\n</div>\n<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<br />\n<br />\n<div class=\"fieldlist_table\" data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\">\n<p class=\"instructions\"><i class=\"icon-info-sign\"></i>Empty list - to add contents: </p><br />\n&nbsp; &nbsp;  1) Use \"Edit Structure\" to add fields to the list <br />\n&nbsp;  &nbsp;  2) Use \"Edit Data\" to add rows\n</div>",
    edit: "<div class=\"btn-group\">\n<a data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\" class=\"btn btn-listfield-data\" href=\"#\"><i class=\"icon-pencil\"></i> Edit Data</a>\n<a data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\" class=\"btn btn-listfield-structure\" href=\"#\"><i class=\"icon-road\"></i> Edit Structure</i></a>\n</div>\n\n<div class='fb-edit-section-header'>List Name</div>\n<input type='text' data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n",
    addButton: "<span class='symbol'><span class='icon-list'></span></span> Field List"
  });

}).call(this);

(function() {
  Formbuilder.registerField('file', {
    repeatable: true,
    icon: 'icon-cloud-upload',
    valueField: false,
    view: "<div class=\"file_container\" data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\"></div>\n<input type='file' name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\" data-name=\"<%= rf.get(Formbuilder.options.mappings.LABEL) %>\" data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>'  />",
    edit: "<div class='fb-edit-section-header'>File Settings</div>\nMax. File Size\n<input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.FILE_SIZE %> | number\" style=\"width: 60px\" /> KB",
    addButton: "<span class=\"symbol\"><span class=\"icon-cloud-upload\"></span></span> File"
  });

}).call(this);

(function() {
  Formbuilder.registerField('location', {
    repeatable: true,
    valueField: false,
    icon: 'icon-location-arrow',
    view: "<% if (rf.get(Formbuilder.options.mappings.LOCATION_UNIT)===\"latlong\"){ %>\nLatitude/Longitude\n<% } else { %>\nEastings/Northings\n<% } %>\n<br />\n<input disabled class='rf-size-small' type='text' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>' />\n<input disabled class='rf-size-small' type='text' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>' />",
    edit: "<div class='fb-edit-section-header'>Location Unit</div>\n<select data-rv-value=\"model.<%= Formbuilder.options.mappings.LOCATION_UNIT %>\" style=\"width: auto;\">\n  <option value=\"latlong\">Latitude / Longitude</option>\n  <option value=\"eastnorth\">Eastings / Northings</option>\n</select>",
    addButton: "<span class='symbol'><span class='icon-location-arrow'></span></span> Location",
    defaultAttributes: function(attrs) {
      attrs[Formbuilder.options.mappings.LOCATION_UNIT] = 'latlong';
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('map', {
    repeatable: true,
    valueField: false,
    icon: 'icon-map-marker',
    view: "<h1><span class='icon-map-marker'></span></h1>",
    edit: "",
    addButton: "<span class='symbol'><span class='icon-map-marker'></span></span> Map",
    defaultAttributes: function(attrs) {
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('number', {
    repeatable: true,
    icon: 'icon-number',
    iconText: '123',
    view: "<input type='number' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>'  value='<%= rf.get(Formbuilder.options.mappings.VALUE) %>' />\n<% if (units = rf.get(Formbuilder.options.mappings.UNITS)) { %>\n  <%= units %>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/min_max']() %>\n<%= Formbuilder.templates['edit/units']() %>\n<%= Formbuilder.templates['edit/integer_only']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-number\">123</span></span> Number"
  });

}).call(this);

(function() {
  Formbuilder.registerField('page_break', {
    icon: 'icon-file',
    type: 'non_input',
    view: "<label class='section-name'>&nbsp; <%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>\n<hr style=\"border-bottom: 2px solid #bbb\">",
    edit: "<div class='fb-edit-section-header'>Label</div>\n<input type='text' data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n<textarea data-rv-input='model.<%= Formbuilder.options.mappings.DESCRIPTION %>'\nplaceholder='Add a longer description to this field'></textarea>",
    addButton: "<span class='symbol'><span class='icon-file'></span></span> Page Break"
  });

}).call(this);

(function() {
  Formbuilder.registerField('paragraph', {
    icon: 'icon-align-justify',
    repeatable: true,
    view: "<textarea class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>' ><%= rf.get(Formbuilder.options.mappings.VALUE) %></textarea>",
    edit: "<%= Formbuilder.templates['edit/size']() %>\n<%= Formbuilder.templates['edit/min_max_length']() %>",
    addButton: "<span class=\"icon icon-align-justify\"></span> Paragraph",
    defaultAttributes: function(attrs) {
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('photo', {
    icon: 'icon-camera',
    repeatable: true,
    valueField: false,
    view: "<h1><span class='icon-camera'></span></h1>",
    edit: "<div class='fb-edit-section-header'>Photo Settings</div>\n<div class=\"inline-labels\">\n<label>Max Height</label>\n<input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.PHOTO_HEIGHT %> | number\" style=\"width: 60px\" /> px<br />\n<label>Max Width</label>\n<input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.PHOTO_WIDTH %> | number\" style=\"width: 60px\" /> px<br />\n<label>Quality</label>\n<input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.PHOTO_QUALITY %> | number\" style=\"width: 60px\" /> %<br />\n<label>Photo Source</label>\n<select data-rv-value=\"model.<%= Formbuilder.options.mappings.PHOTO_SOURCE %>\" style=\"width: auto;\">\n<option value=\"both\">Camera &amp; Library</option>\n<option value=\"camera\">Camera Only</option>\n<option value=\"library\">Library Only</option>\n</select> <br />\n<label>Photo Type</label>\n<select data-rv-value=\"model.<%= Formbuilder.options.mappings.PHOTO_TYPE %>\" style=\"width: auto;\">\n<option value=\"jpeg\">JPEG</option>\n<option value=\"png\">PNG</option>\n</select> <br />\n<label>Save To Photo Album?</label>\n<select data-rv-value=\"model.<%= Formbuilder.options.mappings.PHOTO_SAVE %>\" style=\"width: auto;\">\n<option value=\"true\">Yes</option>\n<option value=\"false\">No</option>\n</select>\n</div>",
    addButton: "<span class='symbol'><span class='icon-camera'></span></span> Photo Capture",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.PHOTO_SOURCE, "both");
      attrs.set(Formbuilder.options.mappings.PHOTO_TYPE, "jpeg");
      attrs.set(Formbuilder.options.mappings.PHOTO_SAVE, "true");
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('price', {
    repeatable: true,
    view: "<div class='input-line'>\n  <span class='above-line'>$</span>\n  <span class='dolars'>\n    <input type='text' />\n    <label>Dollars</label>\n  </span>\n  <span class='above-line'>.</span>\n  <span class='cents'>\n    <input type='text' />\n    <label>Cents</label>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-dollar\"></span></span> Price"
  });

}).call(this);

(function() {
  Formbuilder.registerField('radio', {
    icon: 'icon-circle-blank',
    repeatable: true,
    valueField: false,
    view: "<% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n  <div>\n    <label class='fb-option'>\n      <input type='radio' <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].checked && 'checked' %> onclick=\"javascript: return false;\" />\n      <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n    </label>\n  </div>\n<% } %>\n\n<% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n  <div class='other-option'>\n    <label class='fb-option'>\n      <input type='radio' />\n      Other\n    </label>\n\n    <input type='text' />\n  </div>\n<% } %>",
    edit: "<%= Formbuilder.templates['edit/options']({includeDatasource: true, rf: rf}) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-circle-blank\"></span></span> Radio Buttons",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.FIELD_TYPE, 'radio');
      attrs.set(Formbuilder.options.mappings.OPTIONS, [
        {
          label: "Option 1",
          checked: false
        }, {
          label: "Option 2",
          checked: false
        }
      ]);
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('readOnly', {
    repeatable: false,
    type: 'non_input',
    icon: 'icon-comment',
    view: "<label class='section-name'>&nbsp; <%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n  <% for (i in (rf.get(Formbuilder.options.mappings.OPTIONS) || [])) { %>\n    <div>\n      <label class='fb-option'>\n        <%= rf.get(Formbuilder.options.mappings.OPTIONS)[i].label %>\n      </label>\n    </div>\n    <br/>\n  <% } %>\n\n  <% if (rf.get(Formbuilder.options.mappings.INCLUDE_OTHER)) { %>\n    <div class='other-option'>\n      <input type='text' />\n    </div>\n  <% } %>",
    edit: "<div class='fb-edit-section-header'>Label</div>\n<input type='text' data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n  <%= Formbuilder.templates['edit/readonly']({includeDatasource: true, rf: rf}) %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-comment\"></span></span> Read Only",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.FIELD_TYPE, 'readOnly');
      attrs.set(Formbuilder.options.mappings.REQUIRED, false);
      attrs.set(Formbuilder.options.mappings.OPTIONS, [
        {
          label: "Read Only Text Paragraph"
        }
      ]);
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('section_break', {
    type: 'non_input',
    icon: 'icon-minus',
    view: "<label class='section-name'><%= rf.get(Formbuilder.options.mappings.LABEL) %></label>\n<p><%= rf.get(Formbuilder.options.mappings.DESCRIPTION) %></p>\n<hr style=\"border-bottom: 2px dashed #bbb\">",
    edit: "<div class='fb-edit-section-header'>Label</div>\n<input type='text' data-rv-input='model.<%= Formbuilder.options.mappings.LABEL %>' />\n<textarea data-rv-input='model.<%= Formbuilder.options.mappings.DESCRIPTION %>'\n  placeholder='Add a longer description to this field'></textarea>",
    addButton: "<span class='symbol'><span class='icon-minus'></span></span> Section Break"
  });

}).call(this);

(function() {
  Formbuilder.registerField('signature', {
    repeatable: true,
    valueField: false,
    icon: 'icon-pencil',
    view: "<h1 style=\"border: 1px solid #bbb; padding: 10px; border-radius: 6px;\"><span class='icon-pencil'></span></h1>",
    edit: "",
    addButton: "<span class='symbol'><span class='icon-pencil'></span></span> Signature Capture",
    defaultAttributes: function(attrs) {
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('sliderNumber', {
    repeatable: true,
    icon: 'icon-number',
    iconText: '123',
    view: "<h1 style=\"border: 1px solid #bbb; padding: 10px; border-radius: 6px;\"><span class='icon-exchange'></span></h1>",
    edit: "<%= Formbuilder.templates['edit/min_max_step']() %>",
    addButton: "<span class=\"symbol\"><span class=\"icon-number\">123</span></span> Slider (Number)",
    defaultAttributes: function(attrs) {
      attrs = new Backbone.Model(attrs);
      attrs.set(Formbuilder.options.mappings.MIN, 1);
      attrs.set(Formbuilder.options.mappings.MAX, 10);
      attrs.set(Formbuilder.options.mappings.STEP_SIZE, 1);
      return attrs.toJSON();
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('text', {
    icon: 'icon-font',
    repeatable: true,
    view: "<% var size = rf.get(Formbuilder.options.mappings.SIZE) || 'large'; %>\n<input type='text' data-cid='<%= rf.cid %>' data-_id='<%= rf.get('_id') %>'  value='<%= rf.get(Formbuilder.options.mappings.VALUE) %>' class='rf-size-<%= size %>' />",
    edit: "<%= Formbuilder.templates['edit/size']() %>\n<%= Formbuilder.templates['edit/min_max_length']() %>\n<div class='fb-edit-section-header'>Field Format</div>\n<div class=\"inline-labels\">\n\n<label>Type</label>\n<select data-rv-value=\"model.<%= Formbuilder.options.mappings.FIELD_FORMAT_MODE %>\" class=\"fieldFormatMode\" style=\"width: auto;\">\n  <option value=\"simple\">Simple</option>\n  <option value=\"regex\">Advanced (Regex)</option>\n</select><br />\n<label>Format</label>\n<input type=\"text\" data-rv-input=\"model.<%= Formbuilder.options.mappings.FIELD_FORMAT_STRING %>\" class=\"fieldFormatString\" style=\"width: 150px;\" /><br />\n</div>\n<div class=\"simpleFormat\">\n  <strong>c</strong> = alphanumeric character<br />\n  <strong>n</strong> = number<br />\n  <strong>e.g.</strong> ccnn-nnnn matches ab12-5432, but not 0000-0000\n</div>\n<div class=\"advancedFormat\">\nUse javascript-friendly regular expressions to validate - no need to include surrounding / characters <br />\n<strong>e.g.</strong> .+ but not /.+/\n\n</div>\n",
    addButton: "<span class='symbol'><span class='icon-font'></span></span> Text",
    defaultAttributes: function(attrs) {
      return attrs;
    }
  });

}).call(this);

(function() {
  Formbuilder.registerField('time', {
    repeatable: true,
    view: "<div class='input-line'>\n  <span class='hours'>\n    <input type=\"text\" />\n    <label>HH</label>\n  </span>\n\n  <span class='above-line'>:</span>\n\n  <span class='minutes'>\n    <input type=\"text\" />\n    <label>MM</label>\n  </span>\n\n  <span class='above-line'>:</span>\n\n  <span class='seconds'>\n    <input type=\"text\" />\n    <label>SS</label>\n  </span>\n\n  <span class='am_pm'>\n    <select>\n      <option>AM</option>\n      <option>PM</option>\n    </select>\n  </span>\n</div>",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-time\"></span></span> Time"
  });

}).call(this);

(function() {
  Formbuilder.registerField('website', {
    repeatable: true,
    icon: 'icon-link',
    view: "<input type='text' class='rf-size-<%= rf.get(Formbuilder.options.mappings.SIZE) %>' placeholder='http://' />",
    edit: "",
    addButton: "<span class=\"symbol\"><span class=\"icon-link\"></span></span> Website"
  });

}).call(this);

this["Formbuilder"] = this["Formbuilder"] || {};
this["Formbuilder"]["templates"] = this["Formbuilder"]["templates"] || {};

this["Formbuilder"]["templates"]["edit/base"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p +=
((__t = ( Formbuilder.templates['edit/base_header']() )) == null ? '' : __t) +
'\n<div class="well">\n  ' +
((__t = ( Formbuilder.templates['edit/common']({ rf : rf, editStructure : editStructure, commonCheckboxes : commonCheckboxes, repeatable : repeatable, repeating : repeating }) )) == null ? '' : __t) +
'\n</div>\n';
 if (Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf})){ ;
__p += '\n  <div class="well">\n    ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
'\n  </div>\n';
 } ;
__p += '\n\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base_header"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-field-label\'>\n  <span data-rv-text="model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'"></span>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/base_non_input"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['edit/base_header']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].edit({rf: rf}) )) == null ? '' : __t) +
'\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/checkboxes"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<label class="fb-required">\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.REQUIRED )) == null ? '' : __t) +
'\' />\n  Required\n</label>\n<label class="fb-immediately">\n  <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.VALIDATE_IMMEDIATELY )) == null ? '' : __t) +
'\' />\n  Validate Immediately\n</label>\n<label class="fb-admin_only">\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.ADMIN_ONLY )) == null ? '' : __t) +
'\' />\n    Admin only (Note: Admin fields will not appear in the client app.)\n</label>\n';
 if (repeatable){ ;
__p += '\n  <label class="fb-repeating">\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.REPEATING )) == null ? '' : __t) +
'\' />\n    Repeating\n  </label>\n  <label class="fb-repititions">\n    Min\n    ';
 var disabled = (repeating===true) ? "" : "disabled"; ;
__p += '\n    <input class="minReps" type="text" ' +
((__t = ( disabled )) == null ? '' : __t) +
' data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MINREPITIONS )) == null ? '' : __t) +
' | number" style="width: 30px" />\n    Max\n    <input class="maxReps" type="text" ' +
((__t = ( disabled )) == null ? '' : __t) +
' data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAXREPITIONS)) == null ? '' : __t) +
' | number" style="width: 30px" />\n  </label>\n';
 } ;
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/common"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-common-wrapper\'>\n  <div class=\'fb-label-description\'>\n    ' +
((__t = ( Formbuilder.templates['edit/label_description']({ rf : rf, editStructure : editStructure }) )) == null ? '' : __t) +
'\n  </div>\n  ';
 if (commonCheckboxes){ ;
__p += '\n  <div class=\'fb-common-checkboxes\'>\n    ' +
((__t = ( Formbuilder.templates['edit/checkboxes']({repeatable : repeatable, repeating : repeating}) )) == null ? '' : __t) +
'\n  </div>\n  ';
 } ;
__p += '\n\n  <div class=\'fb-clear\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/integer_only"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<!--<div class=\'fb-edit-section-header\'>Integer only</div>-->\n<!--<label>-->\n  <!--<input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INTEGER_ONLY )) == null ? '' : __t) +
'\' />-->\n  <!--Only accept integers-->\n<!--</label>-->\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/label_description"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (editStructure) { ;
__p += '\n  <div class=\'fb-edit-section-header\'>Name</div>\n  <input type=\'text\' data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.LABEL )) == null ? '' : __t) +
'\' />\n';
 } ;
__p += '\n';
 if (Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].valueField !== false) { ;
__p += '\n  <div class=\'fb-edit-section-header\'>' +
((__t = ( Formbuilder.options.mappings.VALUE_HEADER )) == null ? '' : __t) +
'</div>\n  <input type=\'text\' data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.VALUE )) == null ? '' : __t) +
'\' />\n';
 } ;
__p += '\n<div class="fb-field-description">\n  <div class=\'fb-edit-section-header\'>' +
((__t = ( Formbuilder.options.mappings.DESCRIPTION_TITLE )) == null ? '' : __t) +
'</div>\n  <textarea data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.DESCRIPTION )) == null ? '' : __t) +
'\'\n    placeholder=\'' +
((__t = ( Formbuilder.options.mappings.DESCRIPTION_PLACEHOLDER )) == null ? '' : __t) +
'\'></textarea>\n</div>\n<label class="fb-field-description">\n    <div class=\'fb-edit-section-header\'>Field Code</div>\n    <input type=\'text\' data-rv-input=\'model.' +
((__t = ( Formbuilder.options.mappings.FIELD_CODE )) == null ? '' : __t) +
'\' />\n</label>';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Minimum / Maximum</div>\n\nMin\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
' | number" style="width: 30px" />\n\n&nbsp;&nbsp;\n\nMax\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAX )) == null ? '' : __t) +
' | number" style="width: 30px" />\n\n<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.LENGTH_UNITS )) == null ? '' : __t) +
'" style="width: auto;">\n  <option value="value">Value</option>\n</select>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max_length"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="fb-configure-length">\n  <div class=\'fb-edit-section-header\'>Length Limit</div>\n\n  Min\n  <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
' | number" style="width: 30px" />\n\n  &nbsp;&nbsp;\n\n  Max\n  <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAX)) == null ? '' : __t) +
' | number" style="width: 30px" />\n\n  &nbsp;&nbsp;\n\n  <select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.LENGTH_UNITS )) == null ? '' : __t) +
'" style="width: auto;">\n    <option value="characters">characters</option>\n  </select>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max_options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 if (rf.get(Formbuilder.options.mappings.REQUIRED) === true){ ;
__p += '\n<div class="fb-configure-length">\n  <div class=\'fb-edit-section-header\'>Selected Options Limit</div>\n\n  Min\n  <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
' | number" style="width: 30px" />\n\n  &nbsp;&nbsp;\n\n  Max\n  <input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAX)) == null ? '' : __t) +
' | number" style="width: 30px" />\n</div>\n';
 } ;
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/min_max_step"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Minimum / Maximum</div>\n\nMin\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MIN )) == null ? '' : __t) +
' | number" style="width: 30px" />\n\n&nbsp;&nbsp;\n\nMax\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.MAX )) == null ? '' : __t) +
' | number" style="width: 30px" />\n\nStep Size\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.STEP_SIZE )) == null ? '' : __t) +
' | number" style="width: 30px" />';

}
return __p
};

this["Formbuilder"]["templates"]["edit/options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n';
 if (typeof includeDatasource !== 'undefined'){ ;
__p += '\n  <label class="includeDataSource">\n    ';
 var checked = (rf.get(Formbuilder.options.mappings.DATASOURCE_TYPE)==='dataSource') ? "checked" : ""; ;
__p += '\n      <input type=\'checkbox\' ' +
((__t = (checked)) == null ? '' : __t) +
' />\n      Use a Data Source to populate field options?\n  </label>\n\n ';
 var disabled = (rf.get(Formbuilder.options.mappings.DATASOURCE_TYPE)==='dataSource') ? "" : "disabled"; ;
__p += '\n  <div class=\'ds-dd\'>\n    <select ' +
((__t = (disabled)) == null ? '' : __t) +
' class=\'ds-select\'></select>\n  </div>\n\n  <div class=\'datasource-data-view\'></div>\n';
 } ;
__p += '\n\n';
 if (typeof includeBlank !== 'undefined'){ ;
__p += '\n  <label class="includeBlank">\n    <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_BLANK )) == null ? '' : __t) +
'\' />\n    Include blank\n  </label>\n';
 } ;
__p += '\n\n';
 var isHidden = (rf.get(Formbuilder.options.mappings.DATASOURCE_TYPE)==='dataSource') ? "hidden" : "" ;
__p += '\n<div class=\'option-wrapper ' +
((__t = (isHidden)) == null ? '' : __t) +
'\'>\n  <div class=\'option\' data-rv-each-option=\'model.' +
((__t = ( Formbuilder.options.mappings.OPTIONS )) == null ? '' : __t) +
'\'>\n    ';
 if (typeof noCheckboxes === 'undefined'){ ;
__p += '\n      <input type="checkbox" class=\'js-default-updated\' data-rv-checked="option:checked" />\n    ';
 } ;
__p += '\n    <input type="text" data-rv-input="option:label" class=\'option-label-input\' />\n    <div class="btn-group">\n      <a class="btn btn-success btn-small js-add-option" title="Add Option"><i class=\'icon-plus-sign\'></i></a>\n      <a class="btn btn-danger btn-small js-remove-option" title="Remove Option"><i class=\'icon-minus-sign\'></i></a>\n    </div>\n  </div>\n\n  ';
 if (typeof includeOther !== 'undefined'){ ;
__p += '\n    <label class="includeOther">\n      <input type=\'checkbox\' data-rv-checked=\'model.' +
((__t = ( Formbuilder.options.mappings.INCLUDE_OTHER )) == null ? '' : __t) +
'\' />\n      Include "other"\n    </label>\n  ';
 } ;
__p += '\n  <div class=\'fb-bottom-add\'>\n    <a class="js-add-option ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'">Add option</a>\n  </div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/readonly"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-edit-section-header\'>Options</div>\n\n<label class="includeDataSource">\n  ';
 var checked = (rf.get(Formbuilder.options.mappings.DATASOURCE_TYPE)==='dataSource') ? "checked" : ""; ;
__p += '\n    <input type=\'checkbox\' ' +
((__t = (checked)) == null ? '' : __t) +
' />\n    Use a Data Source to populate field value?\n</label>\n\n';
 var disabled = (rf.get(Formbuilder.options.mappings.DATASOURCE_TYPE)==='dataSource') ? "" : "disabled"; ;
__p += '\n<div class=\'ds-dd\'>\n  <select ' +
((__t = (disabled)) == null ? '' : __t) +
' class=\'ds-select\'></select>\n</div>\n\n<div class=\'datasource-data-view\'></div>\n\n';
 var isHidden = (rf.get(Formbuilder.options.mappings.DATASOURCE_TYPE)==='dataSource') ? "hidden" : "" ;
__p += '\n<div class=\'option-wrapper ' +
((__t = (isHidden)) == null ? '' : __t) +
'\'>\n  <div class=\'option\' data-rv-each-option=\'model.' +
((__t = ( Formbuilder.options.mappings.OPTIONS )) == null ? '' : __t) +
'\'>\n    <textarea type="text" data-rv-input="option:label" class=\'option-label-input\' /></textarea>\n  </div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/size"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<!--<div class=\'fb-edit-section-header\'>Size</div>-->\n<!--<select data-rv-value="model.' +
((__t = ( Formbuilder.options.mappings.SIZE )) == null ? '' : __t) +
'">-->\n  <!--<option value="small">Small</option>-->\n  <!--<option value="medium">Medium</option>-->\n  <!--<option value="large">Large</option>-->\n<!--</select>-->\n';

}
return __p
};

this["Formbuilder"]["templates"]["edit/units"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<!--<div class=\'fb-edit-section-header\'>Units</div>\n<input type="text" data-rv-input="model.' +
((__t = ( Formbuilder.options.mappings.UNITS )) == null ? '' : __t) +
'" />\n-->';

}
return __p
};

this["Formbuilder"]["templates"]["page"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p +=
((__t = ( Formbuilder.templates['partials/save_button']() )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['partials/left_side']({ editStructure : editStructure }) )) == null ? '' : __t) +
'\n' +
((__t = ( Formbuilder.templates['partials/right_side']({ editStructure : editStructure, fieldsEnabled : fieldsEnabled, fieldsEnabledNonInput : fieldsEnabledNonInput}) )) == null ? '' : __t) +
'\n<div class=\'fb-clear\'></div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/add_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'fb-tab-pane active\' id=\'addField\'>\n  <div class=\'fb-add-field-types\'>\n    <div class=\'section\'>\n      ';
 for (i in fieldsEnabled) { ;
__p += '\n        <a data-field-type="' +
((__t = ( i )) == null ? '' : __t) +
'" class="btn btn-primary btn-' +
((__t = ( i )) == null ? '' : __t) +
'">\n          ' +
((__t = ( fieldsEnabled[i].addButton )) == null ? '' : __t) +
'\n        </a>\n      ';
 } ;
__p += '\n    </div>\n\n    <div class=\'section\'>\n      ';
 for (i in fieldsEnabledNonInput) { ;
__p += '\n        <a data-field-type="' +
((__t = ( i )) == null ? '' : __t) +
'" class="btn btn-primary btn-' +
((__t = ( i )) == null ? '' : __t) +
'">\n          ' +
((__t = ( fieldsEnabledNonInput[i].addButton )) == null ? '' : __t) +
'\n        </a>\n      ';
 } ;
__p += '\n    </div>\n  </div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/ds_options"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<option value="prompt">Select a Data Source</option>\n';
 for (i in datasources) { ;
__p += '\n    ';
 var selected = datasources[i]._id == datasource ? "selected" : "";  ;
__p += '\n    <option value="' +
((__t = (datasources[i]._id)) == null ? '' : __t) +
'" ' +
((__t = ( selected )) == null ? '' : __t) +
'>' +
((__t = (datasources[i].name)) == null ? '' : __t) +
'</option>\n';
 };
__p += '\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/edit_field"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-tab-pane\' id=\'editField\'>\n  <div class=\'fb-edit-field-wrapper\'></div>\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["partials/left_side"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'span6 middle\'>\n  <div class=\'fb-no-response-fields\'>No response fields</div>\n  <div class=\'fb-response-fields\'></div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/right_side"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'span4 right\'>\n  <ul class=\'fb-tabs nav nav-tabs compact \'>\n    ';
 if(editStructure){ ;
__p += '\n      <li class=\'active addfield\'><a data-target=\'#addField\'><i class="icon-plus"></i> Field</a></li>\n      <li class="configurefield"><a data-target=\'#editField\'><i class="icon-cog"></i> Field</a></li>\n    ';
 }else{ ;
__p += '\n      <li class="active configurefield"><a data-target=\'#editField\'><i class="icon-cog"></i> Field</a></li>\n    ';
 } ;
__p += '\n  </ul>\n\n  <div class=\'fb-tab-content\'>\n    ';
 if(editStructure){ ;
__p += '\n      ' +
((__t = ( Formbuilder.templates['partials/add_field']( { fieldsEnabledNonInput : fieldsEnabledNonInput, fieldsEnabled : fieldsEnabled } ) )) == null ? '' : __t) +
'\n    ';
 } ;
__p += '\n    ' +
((__t = ( Formbuilder.templates['partials/edit_field']() )) == null ? '' : __t) +
'\n  </div>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["partials/save_button"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'fb-save-wrapper\'>\n  <button class=\'js-save-form ' +
((__t = ( Formbuilder.options.BUTTON_CLASS )) == null ? '' : __t) +
'\'></button>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/base"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  ';
 if (rf.get(Formbuilder.options.mappings.FIELD_ERROR)){ ;
__p += '\n    <p class="text-error">\n      ' +
((__t = ( rf.get(Formbuilder.options.mappings.FIELD_ERROR) )) == null ? '' : __t) +
'\n    </p>\n  ';
 } ;
__p += '\n  <div class=\'cover\'></div>\n  ';
 if(editStructure){  ;
__p += '\n  ' +
((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
'\n  ';
 } ;
__p += '\n  <span class="icon icon-inline ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].icon )) == null ? '' : __t) +
'">' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].iconText )) == null ? '' : __t) +
'</span>\n  ' +
((__t = ( Formbuilder.templates['view/label']({rf: rf}) )) == null ? '' : __t) +
'\n\n  ' +
((__t = ( Formbuilder.templates['view/description']({rf: rf}) )) == null ? '' : __t) +
'\n\n  ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'  \n\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/base_non_input"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'subtemplate-wrapper\'>\n  <div class=\'cover\'></div>\n  ' +
((__t = ( Formbuilder.templates['view/duplicate_remove']({rf: rf}) )) == null ? '' : __t) +
'\n  <span class="icon icon-inline ' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].icon )) == null ? '' : __t) +
'"></span>' +
((__t = ( Formbuilder.fields[rf.get(Formbuilder.options.mappings.FIELD_TYPE)].view({rf: rf}) )) == null ? '' : __t) +
'\n</div>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/description"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<span class=\'help-block\'>\n  ' +
((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.DESCRIPTION)) )) == null ? '' : __t) +
'\n</span>\n';

}
return __p
};

this["Formbuilder"]["templates"]["view/duplicate_remove"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class=\'actions-wrapper btn-group\'>\n  <a class="js-duplicate btn btn-small btn-success" title="Duplicate Field"><i class=\'icon-plus-sign\'></i></a>\n  <a class="js-clear btn btn-small btn-danger" title="Remove Field"><i class=\'icon-minus-sign\'></i></a>\n</div>';

}
return __p
};

this["Formbuilder"]["templates"]["view/label"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<label class="fb-field-title">\n  <span>' +
((__t = ( Formbuilder.helpers.simple_format(rf.get(Formbuilder.options.mappings.LABEL)) )) == null ? '' : __t) +
'\n  ';
 if (rf.get(Formbuilder.options.mappings.REQUIRED)) { ;
__p += '\n    <abbr title=\'required\'>*</abbr>\n  ';
 } ;
__p += '\n</label>\n';

}
return __p
};