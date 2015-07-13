'use strict';

var Matchers = require('../../../Matchers'),
    TestHelper = require('../../../TestHelper');

/* global bootstrapModeler, inject */


var modelingModule = require('../../../../lib/features/modeling'),
    coreModule = require('../../../../lib/core');


describe('features/modeling - attach shape', function() {

  beforeEach(Matchers.addDeepEquals);


  var diagramXML = require('../../../fixtures/bpmn/boundary-events.bpmn');

  var testModules = [ coreModule, modelingModule ];

  beforeEach(bootstrapModeler(diagramXML, { modules: testModules }));


  var subProcessElement, subProcess, task, boundaryEventElement, boundaryEvent;

  beforeEach(inject(function(elementFactory, elementRegistry, canvas, modeling) {
    task = elementRegistry.get('Task_1');

    subProcessElement = elementRegistry.get('SubProcess_1');

    subProcess = subProcessElement.businessObject;

    boundaryEventElement = elementFactory.createShape({
      type: 'bpmn:BoundaryEvent',
      host: task,
      x: 513, y: 254
    });

    boundaryEvent = boundaryEventElement.businessObject;

    task.attachers = [ boundaryEventElement ];

    canvas.addShape(boundaryEventElement, subProcessElement);
  }));


  describe('shape', function() {

    it('should reattach', inject(function(modeling, elementRegistry) {

      // when
      modeling.attachShape(boundaryEventElement, subProcessElement, true);

      // then
      expect(boundaryEvent.attachedToRef).toEqual(subProcess);

      expect(boundaryEvent.cancelActivity).toEqual(true);

      expect(subProcessElement.attachers).toContain(boundaryEventElement);
      expect(task.attachers).not.toContain(boundaryEventElement);
    }));


    it('should undo', inject(function(elementRegistry, commandStack, modeling) {

      // given
      modeling.attachShape(boundaryEventElement, subProcessElement, true);

      // when
      commandStack.undo();

      // then
      expect(boundaryEvent.attachedToRef).toEqual(task.businessObject);
      expect(boundaryEvent.cancelActivity).toEqual(true);

      expect(subProcessElement.attachers).not.toContain(boundaryEventElement);
      expect(task.attachers).toContain(boundaryEventElement);
    }));


    it('should redo', inject(function(elementRegistry, commandStack, modeling) {

      // given
      modeling.attachShape(boundaryEventElement, subProcessElement, true);

      // when
      commandStack.undo();

      commandStack.redo();

      // then
      expect(boundaryEvent.attachedToRef).toEqual(subProcess);
      expect(boundaryEvent.cancelActivity).toEqual(true);

      expect(subProcessElement.attachers).toContain(boundaryEventElement);
      expect(task.attachers).not.toContain(boundaryEventElement);
    }));

  });


  describe('rules', function() {

    it('should allow morphing of an intermediateThrowEvent on a task', inject(function(elementFactory, bpmnRules) {
      var intermediateThrowEvent = elementFactory.createShape({
        type: 'bpmn:IntermediateThrowEvent',
        x: 413, y: 254
      });

      expect(bpmnRules.canAttach(intermediateThrowEvent, task)).toEqual('attach');
    }));


    it('should allow morphing of an intermediateThrowEvent to a boundaryEvent on a subProcess',
      inject(function(elementFactory, bpmnRules) {
      var intermediateThrowEvent = elementFactory.createShape({
        type: 'bpmn:IntermediateThrowEvent',
        x: 413, y: 350
      });

      var position = {
        x: intermediateThrowEvent.x,
        y: intermediateThrowEvent.y
      };

      expect(bpmnRules.canAttach(intermediateThrowEvent, subProcessElement, position)).toEqual('attach');
    }));


    it('should allow dropping of an intermediateThrowEvent on a subProcess',
      inject(function(elementFactory, bpmnRules) {
      var intermediateThrowEvent = elementFactory.createShape({
        type: 'bpmn:IntermediateThrowEvent',
        x: 413, y: 250
      });

      var position = {
        x: intermediateThrowEvent.x,
        y: intermediateThrowEvent.y
      };

      expect(bpmnRules.canAttach(intermediateThrowEvent, subProcessElement, position)).toEqual(true);
    }));

  });

});
