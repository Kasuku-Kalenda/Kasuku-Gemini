/**
 * api/src/models/index.ts — Modèles Mongoose (MongoDB)
 *
 * Mapping fidèle des types TypeScript du frontend (types.ts)
 * Les structures imbriquées (media, sections, leçons, quiz)
 * sont stockées comme sous-documents MongoDB — pas de jointures,
 * cohérent avec le modèle document de MongoDB.
 */

import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Sous-schémas réutilisables ───────────────────────────────────────────────

const ContentSourceSchema = new Schema({
  type:     { type: String, enum: ['central', 'local', 'imported_csv'], required: true },
  id:       { type: String, required: true },
  syncedAt: String,
  version:  String,
}, { _id: false });

const MediaSchema = new Schema({
  type:    { type: String, enum: ['image', 'video'], required: true },
  url:     { type: String, required: true },
  caption: String,
  credit:  String,
}, { _id: false });

const SourceSchema = new Schema({
  label: { type: String, required: true },
  url:   { type: String, required: true },
}, { _id: false });

const ThemeRefSchema = new Schema({
  id:    { type: String, required: true },
  name:  { type: String, required: true },
  slug:  { type: String, required: true },
  color: String,
  emoji: String,
}, { _id: false });

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string | null;
  email: string;
  image: string | null;
  role: 'SUPERADMIN' | 'EDITOR' | 'VIEWER';
  passwordHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name:         { type: String, default: null },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  image:        { type: String, default: null },
  role:         { type: String, enum: ['SUPERADMIN', 'EDITOR', 'VIEWER'], default: 'VIEWER' },
  passwordHash: String,
}, { timestamps: true });

export const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);

// ─── Theme ────────────────────────────────────────────────────────────────────

export interface ITheme extends Document {
  name:   string;
  slug:   string;
  color?: string;
  emoji?: string;
  source?: object;
}

const ThemeSchema = new Schema<ITheme>({
  name:   { type: String, required: true },
  slug:   { type: String, required: true, unique: true, trim: true },
  color:  String,
  emoji:  String,
  source: ContentSourceSchema,
}, { timestamps: true });

export const Theme: Model<ITheme> = mongoose.models.Theme ?? mongoose.model<ITheme>('Theme', ThemeSchema);

// ─── Event ────────────────────────────────────────────────────────────────────

export interface IEvent extends Document {
  title:            string;
  slug:             string;
  summary:          string;
  dateISO?:         string;
  year?:            number;
  period?:          string;
  countryCode?:     string;
  themes:           object[];
  media:            object[];
  sources:          object[];
  timelineId?:      string;
  timelineMomentId?: string;
  timelineSlug?:    string;
  source?:          object;
}

const EventSchema = new Schema<IEvent>({
  title:            { type: String, required: true },
  slug:             { type: String, required: true, unique: true, trim: true },
  summary:          { type: String, required: true },
  dateISO:          String,
  year:             Number,
  period:           String,
  countryCode:      String,
  themes:           [ThemeRefSchema],
  media:            [MediaSchema],
  sources:          [SourceSchema],
  timelineId:       String,
  timelineMomentId: String,
  timelineSlug:     String,
  source:           ContentSourceSchema,
}, { timestamps: true });

EventSchema.index({ title: 'text', summary: 'text' });

export const Event: Model<IEvent> = mongoose.models.Event ?? mongoose.model<IEvent>('Event', EventSchema);

// ─── Timeline ─────────────────────────────────────────────────────────────────

const MomentResourceSchema = new Schema({
  type:    { type: String, enum: ['audio', 'video', 'image', 'pdf', 'link'], required: true },
  title:   { type: String, required: true },
  url:     { type: String, required: true },
  caption: String,
}, { _id: true });

const TimelineMomentSchema = new Schema({
  eventId:    String,
  title:      { type: String, required: true },
  narrative:  { type: String, required: true },
  timeType:   { type: String, enum: ['date', 'period'], required: true },
  dateExact:  String,
  periodText: String,
  position:   { type: Number, default: 0 },
  media:      [MediaSchema],
  resources:  [MomentResourceSchema],
}, { _id: true });

export interface ITimeline extends Document {
  slug:             string;
  title:            string;
  subtitle?:        string;
  type:             'personnage' | 'evenement';
  shortDescription: string;
  longDescription?: string;
  thumbnail:        string;
  periodLabel:      string;
  status:           'draft' | 'published';
  eventCount:       number;
  moments:          object[];
  source?:          object;
}

const TimelineSchema = new Schema<ITimeline>({
  slug:             { type: String, required: true, unique: true, trim: true },
  title:            { type: String, required: true },
  subtitle:         String,
  type:             { type: String, enum: ['personnage', 'evenement'], required: true },
  shortDescription: { type: String, required: true },
  longDescription:  String,
  thumbnail:        { type: String, required: true },
  periodLabel:      { type: String, required: true },
  status:           { type: String, enum: ['draft', 'published'], default: 'draft' },
  eventCount:       { type: Number, default: 0 },
  moments:          [TimelineMomentSchema],
  source:           ContentSourceSchema,
}, { timestamps: true });

TimelineSchema.index({ title: 'text', shortDescription: 'text' });

export const Timeline: Model<ITimeline> = mongoose.models.Timeline ?? mongoose.model<ITimeline>('Timeline', TimelineSchema);

// ─── Training Module ──────────────────────────────────────────────────────────

const QuizQuestionSchema = new Schema({
  question:     { type: String, required: true },
  type:         { type: String, enum: ['multiple_choice', 'true_false'], required: true },
  options:      [String],
  correctIndex: Number,
  correctBool:  Boolean,
  explanation:  String,
}, { _id: true });

const QuizSchema = new Schema({
  title:        String,
  passingScore: { type: Number, required: true },
  questions:    [QuizQuestionSchema],
}, { _id: false });

const LessonSchema = new Schema({
  title:       { type: String, required: true },
  type:        { type: String, enum: ['video', 'audio', 'pdf', 'text', 'quiz'], required: true },
  durationMin: Number,
  url:         String,
  content:     String,
  transcript:  String,
  order:       { type: Number, required: true },
  quiz:        QuizSchema,
}, { _id: true });

const SectionSchema = new Schema({
  title:       { type: String, required: true },
  description: String,
  order:       { type: Number, required: true },
  lessons:     [LessonSchema],
  quiz:        QuizSchema,
}, { _id: true });

const CourseResourceSchema = new Schema({
  type:          { type: String, enum: ['audio', 'video', 'image', 'pdf', 'link', 'event', 'timeline'], required: true },
  title:         { type: String, required: true },
  url:           String,
  eventId:       String,
  timelineSlug:  String,
  description:   String,
}, { _id: true });

const CreatorSchema = new Schema({
  name:      { type: String, required: true },
  avatarUrl: String,
  bio:       String,
  links:     [String],
}, { _id: true });

const SponsorSchema = new Schema({
  name:    { type: String, required: true },
  logoUrl: String,
  linkUrl: String,
}, { _id: true });

export interface IModule extends Document {
  title:           string;
  slug:            string;
  summary:         string;
  durationMin?:    number;
  level?:          string;
  objectives:      string[];
  language?:       string;
  thumbnail?:      string;
  creators:        object[];
  sponsors:        object[];
  sections:        object[];
  eventIds:        string[];
  tags:            string[];
  moduleType?:     'internal' | 'moodle';
  moodleCourseUrl?: string;
  timelineSlug?:   string;
  moodleInstanceId?: string;
  moodleCourseId?:  string;
  moodleMode?:     'lti' | 'offline' | 'url';
  moodlePackageId?: string;
  resources?:      object[];
  finalQuiz?:      object;
  hasCertificate:  boolean;
  certificateName?: string;
  source?:         object;
}

const ModuleSchema = new Schema<IModule>({
  title:            { type: String, required: true },
  slug:             { type: String, required: true, unique: true, trim: true },
  summary:          { type: String, required: true },
  durationMin:      Number,
  level:            String,
  objectives:       [String],
  language:         String,
  thumbnail:        String,
  creators:         [CreatorSchema],
  sponsors:         [SponsorSchema],
  sections:         [SectionSchema],
  eventIds:         [String],
  tags:             [String],
  moduleType:       { type: String, enum: ['internal', 'moodle'] },
  moodleCourseUrl:  String,
  timelineSlug:     String,
  moodleInstanceId: String,
  moodleCourseId:   String,
  moodleMode:       { type: String, enum: ['lti', 'offline', 'url'] },
  moodlePackageId:  String,
  resources:        [CourseResourceSchema],
  finalQuiz:        QuizSchema,
  hasCertificate:   { type: Boolean, default: false },
  certificateName:  String,
  source:           ContentSourceSchema,
}, { timestamps: true });

ModuleSchema.index({ title: 'text', summary: 'text' });

export const TrainingModule: Model<IModule> = mongoose.models.TrainingModule ?? mongoose.model<IModule>('TrainingModule', ModuleSchema);

// ─── Featured Item ────────────────────────────────────────────────────────────

export interface IFeaturedItem extends Document {
  title:     string;
  subtitle:  string;
  imageUrl:  string;
  eventId?:  string;
  active:    boolean;
  startDate: string;
  endDate:   string;
  order:     number;
  ctaLabel:  string;
  ctaTo:     string;
}

const FeaturedItemSchema = new Schema<IFeaturedItem>({
  title:     { type: String, required: true },
  subtitle:  { type: String, required: true },
  imageUrl:  { type: String, required: true },
  eventId:   String,
  active:    { type: Boolean, default: true },
  startDate: { type: String, required: true },
  endDate:   { type: String, required: true },
  order:     { type: Number, default: 0 },
  ctaLabel:  { type: String, required: true },
  ctaTo:     { type: String, required: true },
}, { timestamps: true });

export const FeaturedItem: Model<IFeaturedItem> = mongoose.models.FeaturedItem ?? mongoose.model<IFeaturedItem>('FeaturedItem', FeaturedItemSchema);

// ─── Moodle Instance ──────────────────────────────────────────────────────────

export interface IMoodleInstance extends Document {
  name:              string;
  baseUrl:           string;
  ltiIssuer?:        string;
  ltiClientId?:      string;
  ltiAuthUrl?:       string;
  ltiTokenUrl?:      string;
  ltiKeySetUrl?:     string;
  ltiDeploymentId?:  string;
  apiToken?:         string;
}

const MoodleInstanceSchema = new Schema<IMoodleInstance>({
  name:             { type: String, required: true },
  baseUrl:          { type: String, required: true },
  ltiIssuer:        String,
  ltiClientId:      String,
  ltiAuthUrl:       String,
  ltiTokenUrl:      String,
  ltiKeySetUrl:     String,
  ltiDeploymentId:  String,
  apiToken:         String,
}, { timestamps: true });

export const MoodleInstance: Model<IMoodleInstance> = mongoose.models.MoodleInstance ?? mongoose.model<IMoodleInstance>('MoodleInstance', MoodleInstanceSchema);

// ─── Moodle Course ────────────────────────────────────────────────────────────

const MoodleCourseSchema = new Schema({
  instanceId:     { type: Schema.Types.ObjectId, ref: 'MoodleInstance', required: true },
  remoteCourseId: { type: Number, required: true },
  shortname:      { type: String, required: true },
  fullname:       { type: String, required: true },
  summary:        String,
  language:       String,
}, { timestamps: true });

MoodleCourseSchema.index({ instanceId: 1, remoteCourseId: 1 }, { unique: true });

export const MoodleCourse = mongoose.models.MoodleCourse ?? mongoose.model('MoodleCourse', MoodleCourseSchema);

// ─── Moodle Offline Package ───────────────────────────────────────────────────

const MoodleOfflinePackageSchema = new Schema({
  courseId:     { type: Schema.Types.ObjectId, ref: 'MoodleCourse', required: true },
  type:         { type: String, enum: ['SCORM', 'H5P', 'IMSCC'], required: true },
  title:        { type: String, required: true },
  version:      String,
  storagePath:  { type: String, required: true },
  manifestPath: String,
  sizeBytes:    Number,
  isAvailable:  { type: Boolean, default: false },
}, { timestamps: true });

export const MoodleOfflinePackage = mongoose.models.MoodleOfflinePackage ?? mongoose.model('MoodleOfflinePackage', MoodleOfflinePackageSchema);

// ─── Moodle Course Map ────────────────────────────────────────────────────────

const MoodleCourseMapSchema = new Schema({
  moduleId:  { type: String, required: true },
  courseId:  { type: Schema.Types.ObjectId, ref: 'MoodleCourse' },
  packageId: { type: Schema.Types.ObjectId, ref: 'MoodleOfflinePackage' },
  mode:      { type: String, enum: ['LTI', 'REST', 'OFFLINE'], required: true },
  note:      String,
}, { timestamps: true });

export const MoodleCourseMap = mongoose.models.MoodleCourseMap ?? mongoose.model('MoodleCourseMap', MoodleCourseMapSchema);

// ─── Kalenda ──────────────────────────────────────────────────────────────────

export interface IKalenda extends Document {
  name:        string;
  slug:        string;
  description: string;
  region?:     string;
  themeLabel?: string;
  coverUrl?:   string;
  eventIds:    string[];
  timelineIds: string[];
  moduleIds:   string[];
  themeIds:    string[];
  version:     string;
  status:      'draft' | 'published';
  notes?:      string;
}

const KalendaSchema = new Schema<IKalenda>({
  name:        { type: String, required: true },
  slug:        { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true },
  region:      String,
  themeLabel:  String,
  coverUrl:    String,
  eventIds:    [String],
  timelineIds: [String],
  moduleIds:   [String],
  themeIds:    [String],
  version:     { type: String, required: true, default: '1.0.0' },
  status:      { type: String, enum: ['draft', 'published'], default: 'draft' },
  notes:       String,
}, { timestamps: true });

export const Kalenda: Model<IKalenda> = mongoose.models.Kalenda ?? mongoose.model<IKalenda>('Kalenda', KalendaSchema);
