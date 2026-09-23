const mongoose = require('mongoose');

// One document = one /predict call = one full experiment
// (3 models trained, best one selected, evaluated on a chronological split)
const ModelMetricsSchema = new mongoose.Schema({
    model:     { type: String, required: true },   // "Logistic Regression" etc.
    auc:       { type: Number, required: true },
    precision: { type: Number, required: true },
    recall:    { type: Number, required: true },
    f1:        { type: Number, required: true },
    accuracy:  { type: Number, required: true },
}, { _id: false });

const TopFeatureSchema = new mongoose.Schema({
    feature:    { type: String, required: true },
    importance: { type: Number, required: true },
}, { _id: false });

const ExperimentSchema = new mongoose.Schema({
    ticker: {
        type: String,
        required: true,
        uppercase: true,
        index: true,
    },

    // All 3 models trained in this run, for the comparison table
    modelComparison: {
        type: [ModelMetricsSchema],
        required: true,
    },

    // Which model was auto-selected, and why (its own metrics)
    bestModel: {
        name:    { type: String, required: true },
        metrics: { type: ModelMetricsSchema, required: true },
    },

    // Top 3 most important features for this run's best model
    topFeatures: {
        type: [TopFeatureSchema],
        default: [],
    },

    // How train/test was split — supports the time-series validation work
    validation: {
        method:       { type: String, default: 'chronological (time-series) split' },
        trainRows:    Number,
        testRows:     Number,
        trainPeriod:  String,
        testPeriod:   String,
    },

    // Total engineered features used (11 after the feature-engineering upgrade)
    featureCount: {
        type: Number,
        default: 11,
    },

}, { timestamps: true });   // adds createdAt / updatedAt automatically

// Fast lookups: latest experiments first, filterable by ticker
ExperimentSchema.index({ createdAt: -1 });
ExperimentSchema.index({ ticker: 1, createdAt: -1 });

module.exports = mongoose.model('Experiment', ExperimentSchema);