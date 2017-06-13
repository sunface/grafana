///<reference path="../../../headers/common.d.ts" />

import $ from 'jquery';
import coreModule from '../../core_module';

import 'jquery-ui';
import 'gridstack';
import 'gridstack.jquery-ui';

const template = `
<div gridstack gridstack-handler="ctrl.gridstack" class="grid-stack"
      options="ctrl.options"
      on-change="ctrl.onChange(event,items)"
      on-drag-start="ctrl.onDragStart(event,ui)"
      on-drag-stop="ctrl.onDragStop(event, ui)"
      on-resize-start="ctrl.onResizeStart(event, ui)"
      on-resize-stop="ctrl.onResizeStop(event, ui)">

      <div gridstack-item ng-repeat="panel in ctrl.panels"
          class="grid-stack-item"
          gs-item-id="panel.id"
          gs-item-x="panel.x"
          gs-item-y="panel.y"
          gs-item-width="panel.width"
          gs-item-height="panel.height"
          gs-item-autopos="1"
          on-item-added="ctrl.onItemAdded(item)"
          on-item-removed="ctrl.onItemRemoved(item)">
        <plugin-component type="panel" class="panel-margin grid-stack-item-content">
        </plugin-component>
      </div>
</div>
`;

export class DashGridCtrl {
  options: any;

  /** @ngInject */
  constructor(private $rootScope) {
    this.options = {
      animate: true,
    };
  }

  onResizeStop() {
    this.$rootScope.$broadcast('render');
  }
}

export function dashGrid($timeout) {
  return {
    restrict: 'E',
    template: template,
    controller: DashGridCtrl,
    bindToController: true,
    controllerAs: 'ctrl',
    scope: {
      dashboard: "="
    },
    link: function(scope, elem, attrs, ctrl) {

      ctrl.panels = [];
      ctrl.dashboard.forEachPanel((panel, panelIndex, row, rowIndex) => {
        panel.width = 4;
        panel.height = 4;
        panel.x = panelIndex * 4;
        panel.y = rowIndex * 4;
        ctrl.panels.push(panel);
      });

    }
  };
}

/** @ngInject */
coreModule.controller('GridstackController', ['$scope', function($scope) {

  var gridstack = null;

  this.init = function(element, options) {
    gridstack = element.gridstack(options).data('gridstack');
    return gridstack;
  };

  this.removeItem = function(element) {
    if (gridstack) {
      return gridstack.removeWidget(element, false);
    }
    return null;
  };

  this.addItem = function(element) {
    if (gridstack) {
      gridstack.makeWidget(element);
      return element;
    }
    return null;
  };

}]);

/** @ngInject */
coreModule.directive('gridstack', ['$timeout', function($timeout) {
  return {
    restrict: "A",
    controller: 'GridstackController',
    scope: {
      onChange: '&',
      onDragStart: '&',
      onDragStop: '&',
      onResizeStart: '&',
      onResizeStop: '&',
      gridstackHandler: '=',
      options: '='
    },
    link: function (scope, element, attrs, controller, ngModel) {

      var gridstack = controller.init(element, scope.options);
      scope.gridstackHandler = gridstack;

      element.on('change', function (e, items) {
        $timeout(function() {
          scope.$apply();
          scope.onChange({event: e, items: items});
        });
      });

      element.on('dragstart', function(e, ui) {
        scope.onDragStart({event: e, ui: ui});
      });

      element.on('dragstop', function(e, ui) {
        $timeout(function() {
          scope.$apply();
          scope.onDragStop({event: e, ui: ui});
        });
      });

      element.on('resizestart', function(e, ui) {
        scope.onResizeStart({event: e, ui: ui});
      });

      element.on('resizestop', function(e, ui) {
        $timeout(function() {
          scope.$apply();
          scope.onResizeStop({event: e, ui: ui});
        });
      });

    }
  };
}]);

/** @ngInject */
coreModule.directive('gridstackItem', ['$timeout', function($timeout) {

  return {
    restrict: "A",
    controller: 'GridstackController',
    require: '^gridstack',
    scope: {
      gridstackItem: '=',
      onItemAdded: '&',
      onItemRemoved: '&',
      gsItemId: '=',
      gsItemX: '=',
      gsItemY: '=',
      gsItemWidth: '=',
      gsItemHeight: '=',
      gsItemAutopos: '='
    },
    link: function (scope, element, attrs, controller) {
      $(element).attr('data-gs-id', scope.gsItemId);
      $(element).attr('data-gs-x', scope.gsItemX);
      $(element).attr('data-gs-y', scope.gsItemY);
      $(element).attr('data-gs-width', scope.gsItemWidth);
      $(element).attr('data-gs-height', scope.gsItemHeight);
      $(element).attr('data-gs-auto-position', scope.gsItemAutopos);
      var widget = controller.addItem(element);
      var item = element.data('_gridstack_node');
      $timeout(function() {
        scope.onItemAdded({item: item});
      });
      scope.$watch(function () { return $(element).attr('data-gs-id'); }, function (val) {
        scope.gsItemId = val;
      });
      scope.$watch(function(){ return $(element).attr('data-gs-x'); }, function(val) {
        scope.gsItemX = val;
      });

      scope.$watch(function(){ return $(element).attr('data-gs-y'); }, function(val) {
        scope.gsItemY = val;
      });

      scope.$watch(function(){ return $(element).attr('data-gs-width'); }, function(val) {
        scope.gsItemWidth = val;
      });

      scope.$watch(function(){ return $(element).attr('data-gs-height'); }, function(val) {
        scope.gsItemHeight = val;
      });

      element.bind('$destroy', function() {
        var item = element.data('_gridstack_node');
        scope.onItemRemoved({item: item});
        controller.removeItem(element);
      });
    }
  };
}]);

coreModule.directive('dashGrid', dashGrid);
