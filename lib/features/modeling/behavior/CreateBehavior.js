'use strict';

var inherits = require('inherits');

var CommandInterceptor = require('diagram-js/lib/command/CommandInterceptor');

var is = require('../../../util/ModelUtil').is;

/**
 * BPMN specific create behavior
 */
function CreateBehavior(eventBus, modeling, elementFactory, bpmnFactory) {

  CommandInterceptor.call(this, eventBus);

  /**
   * morph process into collaboration before adding
   * participant onto collaboration
   */

  this.preExecute('shape.create', function(context) {

    var parent = context.parent,
        shape = context.shape,
        position = context.position;

    if (is(parent, 'bpmn:Process') && is(shape, 'bpmn:Participant')) {

      // this is going to detach the process root
      // and set the returned collaboration element
      // as the new root element
      var collaborationElement = modeling.makeCollaboration();

      // monkey patch the create context
      // so that the participant is being dropped
      // onto the new collaboration root instead
      context.position = position;
      context.parent = collaborationElement;

      context.processRoot = parent;
    }
  }, true);

  this.preExecute('shape.create', function(context) {
    var shape = context.shape,
        host = context.host,
        businessObject,
        boundaryEvent;

    var attrs = {
      cancelActivity: true
    };

    if (host && is(shape, 'bpmn:IntermediateThrowEvent')) {
      attrs.attachedToRef = host.businessObject.id;

      businessObject = bpmnFactory.create('bpmn:BoundaryEvent', attrs);

      boundaryEvent = {
        type: 'bpmn:BoundaryEvent',
        businessObject: businessObject
      };

      context.shape = elementFactory.createShape(boundaryEvent);
    }
  }, true);

  this.execute('shape.create', function(context) {

    var processRoot = context.processRoot,
        shape = context.shape;

    if (processRoot) {
      context.oldProcessRef = shape.businessObject.processRef;

      // assign the participant processRef
      shape.businessObject.processRef = processRoot.businessObject;
    }
  }, true);


  this.revert('shape.create', function(context) {
    var processRoot = context.processRoot,
        shape = context.shape;

    if (processRoot) {
      // assign the participant processRef
      shape.businessObject.processRef = context.oldProcessRef;
    }
  }, true);

  this.postExecute('shape.create', function(context) {

    var processRoot = context.processRoot,
        shape = context.shape;

    if (processRoot) {
      // process root is already detached at this point
      var processChildren = processRoot.children.slice();
      modeling.moveShapes(processChildren, { x: 0, y: 0 }, shape);
    }

  }, true);

  // Pass the correct shape before the element is 'selected'
  eventBus.on('create.end', 750, function(event) {
    var attachers = event.hover.attachers,
        context = event.context;


    if (attachers && is(event.shape, 'bpmn:IntermediateThrowEvent') && context.canExecute === 'attach') {
      event.shape = attachers[attachers.length - 1];
    }
  });

}

CreateBehavior.$inject = [ 'eventBus', 'modeling', 'elementFactory', 'bpmnFactory' ];

inherits(CreateBehavior, CommandInterceptor);

module.exports = CreateBehavior;
