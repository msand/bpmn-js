'use strict';

var TestHelper = require('../../../../TestHelper');

/* global bootstrapModeler, inject */


var modelingModule = require('../../../../../lib/features/modeling'),
    snappingModule = require('../../../../../lib/features/snapping'),
    createModule = require('diagram-js/lib/features/create'),
    coreModule = require('../../../../../lib/core');

var Events = require('diagram-js/test/util/Events');

describe('features/modeling - create participant', function() {

  var testModules = [ coreModule, modelingModule ];


  describe('on process diagram', function() {

    describe('should transform diagram into collaboration', function() {

      var processDiagramXML = require('../../../../fixtures/bpmn/collaboration/process-empty.bpmn');

      beforeEach(bootstrapModeler(processDiagramXML, { modules: testModules }));


      it('execute', inject(function(modeling, elementFactory, canvas) {

        // given
        var processShape = canvas.getRootElement(),
            process = processShape.businessObject,
            participantShape = elementFactory.createParticipantShape(true),
            participant = participantShape.businessObject,
            diRoot = process.di.$parent;

        // when
        modeling.createShape(participantShape, { x: 350, y: 200 }, processShape);

        // then
        expect(participant.processRef).toBe(process);

        var collaborationRoot = canvas.getRootElement(),
            collaboration = collaborationRoot.businessObject,
            collaborationDi = collaboration.di;

        expect(collaboration.$instanceOf('bpmn:Collaboration')).toBe(true);

        // participant / collaboration are wired
        expect(participant.$parent).toBe(collaboration);
        expect(collaboration.participants).toContain(participant);


        // collaboration is added to root elements
        expect(collaboration.$parent).toBe(process.$parent);

        // di is wired
        var participantDi = participant.di;

        expect(participantDi.$parent).toBe(collaborationDi);
        expect(collaborationDi.$parent).toBe(diRoot);
      }));


      it('undo', inject(function(modeling, elementFactory, canvas, commandStack) {

        // given
        var processShape = canvas.getRootElement(),
            process = processShape.businessObject,
            processDi = process.di,
            participantShape = elementFactory.createParticipantShape(true),
            participant = participantShape.businessObject,
            oldParticipantProcessRef = participant.processRef,
            diRoot = process.di.$parent;

        modeling.createShape(participantShape, { x: 350, y: 200 }, processShape);

        var collaborationRoot = canvas.getRootElement(),
            collaboration = collaborationRoot.businessObject;

        // when
        commandStack.undo();


        // then
        expect(participant.processRef).toBe(oldParticipantProcessRef);

        expect(participant.$parent).toBe(null);
        expect(collaboration.participants).not.toContain(participant);

        // collaboration is detached
        expect(collaboration.$parent).toBe(null);

        // di is wired
        expect(processDi.$parent).toBe(diRoot);
      }));

    });


    describe('should wrap existing elements', function() {

      var processDiagramXML = require('../../../../fixtures/bpmn/collaboration/process.bpmn');

      beforeEach(bootstrapModeler(processDiagramXML, { modules: testModules }));


      it('execute', inject(function(modeling, elementFactory, canvas) {

        // given
        var processShape = canvas.getRootElement(),
            process = processShape.businessObject,
            participantShape = elementFactory.createParticipantShape(true),
            participant = participantShape.businessObject;

        // when
        modeling.createShape(participantShape, { x: 350, y: 200 }, processShape);

        // then
        expect(participant.processRef).toBe(process);

        var newRootShape = canvas.getRootElement(),
            collaboration = newRootShape.businessObject;

        expect(collaboration.$instanceOf('bpmn:Collaboration')).toBe(true);

        expect(participant.$parent).toBe(collaboration);
        expect(collaboration.participants).toContain(participant);
      }));


      it('undo', inject(function(modeling, elementFactory, elementRegistry, canvas, commandStack) {

        // given
        var processShape = canvas.getRootElement(),
            participantShape = elementFactory.createParticipantShape(true);

        modeling.createShape(participantShape, { x: 350, y: 200 }, processShape);

        // when
        commandStack.undo();

        var startEventElement = elementRegistry.get('StartEvent_1'),
            startEventDi = startEventElement.businessObject.di,
            rootElement = canvas.getRootElement(),
            rootShapeDi = rootElement.businessObject.di;

        // then
        expect(participantShape.children.length).toBe(0);
        expect(processShape.children.length).toBe(9);

        // children di is wired
        expect(startEventDi.$parent).toEqual(rootShapeDi);
        expect(rootShapeDi.planeElement).toContain(startEventDi);
      }));


      it('should detach DI on update canvas root', inject(function(canvas, elementFactory, commandStack, modeling, elementRegistry) {

          // when
          modeling.makeCollaboration();

          var startEventElement = elementRegistry.get('StartEvent_1'),
              startEventDi = startEventElement.businessObject.di,
              rootElement = canvas.getRootElement(),
              rootShapeDi = rootElement.businessObject.di;

          // then
          expect(startEventDi.$parent).toBeFalsy();
          expect(rootShapeDi.planeElement).not.toContain(startEventDi);
      }));

    });

  });


  describe('should add to collaboration', function() {

    var collaborationDiagramXML = require('../../../../fixtures/bpmn/collaboration/collaboration-participant.bpmn');

    beforeEach(bootstrapModeler(collaborationDiagramXML, { modules: testModules }));


    it('execute', inject(function(modeling, elementFactory, canvas) {

      // given
      var collaborationRoot = canvas.getRootElement(),
          collaboration = collaborationRoot.businessObject,
          participantShape = elementFactory.createParticipantShape(true),
          participant = participantShape.businessObject;

      // when
      modeling.createShape(participantShape, { x: 350, y: 500 }, collaborationRoot);

      // then
      expect(collaborationRoot.children).toContain(participantShape);

      expect(participant.$parent).toBe(collaboration);
      expect(collaboration.participants).toContain(participant);
    }));


    it('undo', inject(function(modeling, elementFactory, canvas, commandStack) {

      // given
      var collaborationRoot = canvas.getRootElement(),
          collaboration = collaborationRoot.businessObject,
          participantShape = elementFactory.createParticipantShape(true),
          participant = participantShape.businessObject;

      modeling.createShape(participantShape, { x: 350, y: 500 }, collaborationRoot);

      // when
      commandStack.undo();

      // then
      expect(collaborationRoot.children).not.toContain(participantShape);

      expect(participant.$parent).toBeFalsy();
      expect(collaboration.participants).not.toContain(participant);
    }));

  });

  describe('boundary event', function () {

    var processDiagramXML = require('../../../../fixtures/bpmn/collaboration/process-empty.bpmn');

    beforeEach(bootstrapModeler(processDiagramXML, { modules: testModules.concat(createModule, snappingModule) }));

    var createEvent;

    beforeEach(inject(function(dragging, canvas) {
      createEvent = Events.scopedCreate(canvas);

      dragging.setOptions({ manual: true });
    }));

    afterEach(inject(function(dragging) {
      dragging.setOptions({ manual: false });
    }));

    it('should morph an IntermediateThrowEvent to a BoundaryEvent -> Modeling',
      inject(function(elementFactory, modeling, canvas) {

      var rootShape = canvas.getRootElement(),
          task = elementFactory.createShape({ type: 'bpmn:Task' }),
          intermediateEvent = elementFactory.createShape({ type: 'bpmn:IntermediateThrowEvent' }),
          boundaryEvent;

      // given
      modeling.createShape(task, { x: 100, y: 100 }, rootShape);

      // when
      modeling.createShape(intermediateEvent, { x: 150, y: 135 }, task, true);

      boundaryEvent = task.attachers[0];

      // then
      expect(boundaryEvent.type).toEqual('bpmn:BoundaryEvent');
      expect(boundaryEvent.businessObject.attachedToRef).toMatch('Task');
    }));


    it('should morph an IntermediateThrowEvent to a BoundaryEvent -> Create',
      inject(function(elementFactory, create, canvas, dragging, modeling, elementRegistry) {
      // given
      var rootShape = canvas.getRootElement(),
          task = elementFactory.createShape({ type: 'bpmn:Task' }),
          intermediateEvent = elementFactory.createShape({ type: 'bpmn:IntermediateThrowEvent' }),
          boundaryEvent;

      modeling.createShape(task, { x: 100, y: 100 }, rootShape);

      // when
      create.start(createEvent({ x: 0, y: 0 }), intermediateEvent);

      dragging.hover({ element: task, gfx: elementRegistry.getGraphics(task) });
      dragging.move(createEvent({ x: 50 + 18, y: 100 }));

      dragging.end();

      boundaryEvent = task.attachers[0];

      // then
      expect(boundaryEvent.type).toEqual('bpmn:BoundaryEvent');
      expect(boundaryEvent.businessObject.attachedToRef).toMatch('Task');
    }));


    it('should NOT morph an IntermediateThrowEvent to a BoundaryEvent',
      inject(function(elementFactory, create, canvas, dragging, modeling, elementRegistry) {

      var rootShape = canvas.getRootElement(),
          subProcess = elementFactory.createShape({ type: 'bpmn:SubProcess', isExpanded: true }),
          intermediateEvent = elementFactory.createShape({ type: 'bpmn:IntermediateThrowEvent' }),
          intermediateEventId = intermediateEvent.id;

      modeling.createShape(subProcess, { x: 300, y: 200 }, rootShape);

      create.start(createEvent({ x: 0, y: 0 }), intermediateEvent);

      dragging.hover({ element: subProcess, gfx: elementRegistry.getGraphics(subProcess) });

      dragging.move(createEvent({ x: 300, y: 200 }));
      dragging.end();

      intermediateEvent = elementRegistry.get(intermediateEventId);

      // then
      expect(intermediateEvent).toBeDefined();
      expect(intermediateEvent.type).toEqual('bpmn:IntermediateThrowEvent');
    }));

  });

});
