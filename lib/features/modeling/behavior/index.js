module.exports = {
  __init__: [
    'appendBehavior',
    'createParticipantBehavior',
    'createBoundaryEventBehavior',
    'createOnFlowBehavior',
    'dropBehavior',
    'removeBehavior',
    'modelingFeedback'
  ],
  appendBehavior: [ 'type', require('./AppendBehavior') ],
  dropBehavior: [ 'type', require('./DropBehavior') ],
  createParticipantBehavior: [ 'type', require('./CreateParticipantBehavior') ],
  createBoundaryEventBehavior: [ 'type', require('./CreateBoundaryEventBehavior') ],
  createOnFlowBehavior: [ 'type', require('./CreateOnFlowBehavior') ],
  removeBehavior: [ 'type', require('./RemoveBehavior') ],
  modelingFeedback: [ 'type', require('./ModelingFeedback') ]
};