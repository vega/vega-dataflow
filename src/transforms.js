// Core Data Transforms
import Aggregate from './data/aggregate/Aggregate';
import Apply from './data/Apply';
import Bin from './data/Bin';
import Collect from './data/Collect';
import Compare from './data/Compare';
import CountIndex from './data/CountIndex';
import CountPattern from './data/CountPattern';
import Extent from './data/Extent';
import Facet from './data/Facet';
import Field from './data/Field';
import Filter from './data/Filter';
import Fold from './data/Fold';
import Generate from './data/Generate';
import Impute from './data/Impute';
import Key from './data/Key';
import Lookup from './data/Lookup';
import MultiExtent from './data/MultiExtent';
import NoOp from './data/NoOp';
import Params from './data/Params';
import PreFacet from './data/PreFacet';
import Range from './data/Range';
import Rank from './data/Rank';
import Reflow from './data/Reflow';
import Relay from './data/Relay';
import Sample from './data/Sample';
import Sieve from './data/Sieve';
import Subflow from './data/Subflow';
import TupleIndex from './data/TupleIndex';
import Values from './data/Values';
// CrossFilter Transforms
import CrossFilter from './data/crossfilter/CrossFilter';
import ResolveFilter from './data/crossfilter/ResolveFilter';
// Encoding Transforms
import AxisTicks from './encode/AxisTicks';
import DataJoin from './encode/DataJoin';
import Encode from './encode/Encode';
import LegendEntries from './encode/LegendEntries';
import Scale from './encode/Scale';
// Layout Transforms
import Force from './layout/Force';
import LinkPath from './layout/LinkPath';
import Pie from './layout/Pie';
import Stack from './layout/Stack';
import Voronoi from './layout/Voronoi';
// Geo Transforms
import GeoPath from './geo/GeoPath';
import GeoPoint from './geo/GeoPoint';
import GeoShape from './geo/GeoShape';
import Graticule from './geo/Graticule';
import Projection from './geo/Projection';
// Hierarchy Transforms
import Nest from './hierarchy/Nest';
import Stratify from './hierarchy/Stratify';
import TreeLinks from './hierarchy/TreeLinks';
import {Pack, Partition, Tree, Treemap} from './hierarchy/Layouts';

export var transforms = {
  Aggregate: Aggregate,
  Apply: Apply,
  Bin: Bin,
  Collect: Collect,
  Compare: Compare,
  CountIndex: CountIndex,
  CountPattern: CountPattern,
  Extent: Extent,
  Facet: Facet,
  Field: Field,
  Filter: Filter,
  Fold: Fold,
  Generate: Generate,
  Impute: Impute,
  Key: Key,
  Lookup: Lookup,
  MultiExtent: MultiExtent,
  NoOp: NoOp,
  Params: Params,
  PreFacet: PreFacet,
  Range: Range,
  Rank: Rank,
  Reflow: Reflow,
  Relay: Relay,
  Sample: Sample,
  Sieve: Sieve,
  Subflow: Subflow,
  TupleIndex: TupleIndex,
  Values: Values,
  CrossFilter: CrossFilter,
  ResolveFilter: ResolveFilter,
  AxisTicks: AxisTicks,
  DataJoin: DataJoin,
  Encode: Encode,
  LegendEntries: LegendEntries,
  Scale: Scale,
  Force: Force,
  LinkPath: LinkPath,
  Pie: Pie,
  Stack: Stack,
  Voronoi: Voronoi,
  GeoPath: GeoPath,
  GeoPoint: GeoPoint,
  GeoShape: GeoShape,
  Graticule: Graticule,
  Projection: Projection,
  Nest: Nest,
  Stratify: Stratify,
  TreeLinks: TreeLinks,
  Pack: Pack,
  Partition: Partition,
  Tree: Tree,
  Treemap: Treemap
};

export default function(name, constructor) {
  return arguments.length > 1 ? (transforms[name] = constructor, this)
    : transforms.hasOwnProperty(name) ? transforms[name] : null;
}
