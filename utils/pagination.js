const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePagination = (query = {}, defaultLimit = DEFAULT_LIMIT) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), MAX_LIMIT);
  return { page, limit, skip: (page - 1) * limit };
};

const buildMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(Math.ceil(total / limit), 1),
});

// Runs a find() with pagination; `build` can add sort/populate/select to the query
const paginate = async (Model, filter, query, build = (q) => q, defaultLimit) => {
  const p = parsePagination(query, defaultLimit);
  const [data, total] = await Promise.all([
    build(Model.find(filter)).skip(p.skip).limit(p.limit),
    Model.countDocuments(filter),
  ]);
  return { data, pagination: buildMeta(p, total) };
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { parsePagination, buildMeta, paginate, escapeRegex };
