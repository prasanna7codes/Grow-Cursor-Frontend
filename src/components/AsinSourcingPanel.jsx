import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { alpha } from '@mui/material/styles';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  FormControlLabel,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  AutoAwesome as SourceIcon,
  Refresh as MoreIcon
} from '@mui/icons-material';
import api, { getAuthToken } from '../lib/api.js';
import { BRAND_DARK, BRAND_YELLOW, BRAND_YELLOW_DARK } from '../constants/brandTheme.js';

/**
 * Automated ASIN sourcing, ahead of the precheck.
 *
 * Replaces browsing Amazon and pasting ASINs by hand: type what you would have
 * typed into Amazon's search box, set the price band, and get ASINs back.
 *
 * Scrapingdog's search API takes a keyword and a page number and nothing else —
 * no category, no price filter, no sort — so the price band is applied to the
 * results here rather than at the source. See utils/scrapingdogSearch.js.
 *
 * The run is remembered, which is what makes "Find more" work: after discarding
 * most of a batch in review, asking for more resumes paging where the last
 * request stopped and never re-offers an ASIN this run has already shown.
 */

// A short run has several very different causes, and the fix differs for each.
// Naming the cause beats a generic "try widening the filters".
const STOP_REASON_HINTS = {
  keyword_dry: 'Amazon stopped returning results for this keyword. Try a broader or different term.',
  page_ceiling: 'Hit the page depth limit for this keyword. Add another keyword rather than paging deeper.',
  errors: 'Search requests were failing. Check the Scrapingdog credit balance and try again.',
  already_listed: 'Most of what this keyword finds is already active for this seller. Use a more specific keyword to reach products you have not covered yet.',
  rounds: 'Most of what was found was filtered out. Widen the price range or use a different keyword.'
};

const SOURCING_PREFERENCES_KEY = 'asinSourcingPreferences';

const DEFAULTS = {
  keywords: '',
  targetCount: 50
};

function loadPreferences() {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const saved = JSON.parse(window.localStorage.getItem(SOURCING_PREFERENCES_KEY) || '{}');
    return { ...DEFAULTS, ...saved };
  } catch {
    return DEFAULTS;
  }
}

export default function AsinSourcingPanel({
  sellerId,
  templateId,
  region,
  disabled = false,
  autoRun = true,
  onAutoRunChange,
  inactiveOnly = true,
  onInactiveOnlyChange,
  // Taken from the precheck filters rather than duplicated here. Sourcing that
  // ignored them would buy ASINs the precheck immediately throws away.
  priceMin = '',
  priceMax = '',
  minRating = '',
  onAsinsFound
}) {
  const saved = useMemo(() => loadPreferences(), []);

  const [keywords, setKeywords] = useState(saved.keywords);
  const [targetCount, setTargetCount] = useState(saved.targetCount);

  const [sourcing, setSourcing] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [error, setError] = useState('');
  const [runId, setRunId] = useState(null);

  const eventSourceRef = useRef(null);

  useEffect(() => () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SOURCING_PREFERENCES_KEY, JSON.stringify({
        keywords, targetCount
      }));
    } catch {
      // Convenience only — sourcing works without it.
    }
  }, [keywords, targetCount]);

  // Comma-separated keywords are searched round-robin, so three terms return a
  // spread rather than everything from whichever was typed first.
  const keywordList = useMemo(
    () => keywords.split(',').map(k => k.trim()).filter(Boolean),
    [keywords]
  );

  const startSourcing = useCallback((options = {}) => {
    const { topUp = false } = options;
    const wanted = Math.min(100, Math.max(1, parseInt(targetCount, 10) || 0));

    setError('');

    if (!sellerId || !templateId) {
      setError('Pick a seller and template first');
      return;
    }
    if (!topUp && keywordList.length === 0) {
      setError('Type a search keyword');
      return;
    }
    if (!wanted) {
      setError('How many ASINs do you want?');
      return;
    }

    const min = priceMin === '' ? null : Number(priceMin);
    const max = priceMax === '' ? null : Number(priceMax);
    if (min !== null && max !== null && min > max) {
      setError('Lowest price is above the highest price');
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSourcing(true);
    setProgress({ found: 0, target: wanted, pagesFetched: 0, creditsSpent: 0 });
    if (!topUp) setOutcome(null);

    const params = new URLSearchParams({
      targetCount: String(wanted),
      region: region || 'US',
      token: getAuthToken()
    });

    // A top-up continues an existing run, so it carries the run id instead of
    // the keywords and price band — those are frozen on the run itself.
    if (topUp && runId) {
      params.set('runId', runId);
    } else {
      params.set('sellerId', sellerId);
      params.set('templateId', templateId);
      params.set('keywords', keywordList.join(','));
      if (min !== null) params.set('priceMin', String(min));
      if (max !== null) params.set('priceMax', String(max));
      // Applied to the search rows, so a low-rated product never costs a
      // product-detail credit just to be dropped by the precheck afterwards.
      const rating = minRating === '' ? null : Number(minRating);
      if (rating !== null && Number.isFinite(rating)) params.set('minRating', String(rating));
    }

    const eventSource = new EventSource(`${api.defaults.baseURL}/asin-sourcing/stream?${params.toString()}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        eventSource.close();
        eventSourceRef.current = null;
        setSourcing(false);
        return;
      }

      let payload;
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }

      if (payload.type === 'started') {
        setRunId(payload.runId);
        return;
      }

      if (payload.type === 'progress') {
        setProgress(payload);
        return;
      }

      if (payload.type === 'error') {
        setError(payload.error || 'Sourcing failed');
        setSourcing(false);
        return;
      }

      if (payload.type === 'complete') {
        setRunId(payload.runId);
        setOutcome(payload);
        setProgress(null);
        setSourcing(false);
        if (payload.asins?.length > 0) {
          onAsinsFound?.(payload.asins, { runId: payload.runId, topUp });
        }
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      eventSourceRef.current = null;
      setSourcing(false);
      setError('Connection lost while sourcing ASINs');
    };
  }, [
    sellerId, templateId, region, keywordList,
    priceMin, priceMax, minRating, targetCount, runId, onAsinsFound
  ]);

  const busy = disabled || sourcing;

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: alpha(BRAND_DARK, 0.12),
        bgcolor: alpha(BRAND_YELLOW, 0.06)
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <SourceIcon sx={{ color: BRAND_YELLOW_DARK }} fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Find ASINs from Amazon search
          </Typography>
          {keywordList.length > 1 && (
            <Chip size="small" label={`${keywordList.length} keywords`} sx={{ fontWeight: 700 }} />
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Only continue ASINs with no live listing yet. An active ASIN already has one, so generating it again produces a duplicate to update rather than a new listing.">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={inactiveOnly}
                  onChange={(event) => onInactiveOnlyChange?.(event.target.checked)}
                  disabled={busy}
                />
              }
              label="Inactive only"
              sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5, fontWeight: 700, fontSize: '0.82rem' } }}
            />
          </Tooltip>
          <Tooltip title="Run the precheck and go straight to the generated listings. Your saved filters, keyword include/exclude and eBay Motors mode all still apply — this only skips the manual select-and-continue step.">
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={autoRun}
                  onChange={(event) => onAutoRunChange?.(event.target.checked)}
                  disabled={busy}
                />
              }
              label="Straight to review"
              sx={{ m: 0, '& .MuiFormControlLabel-label': { ml: 0.5, fontWeight: 700, fontSize: '0.82rem' } }}
            />
          </Tooltip>
        </Stack>

        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        <TextField
          label="Search keywords"
          size="small"
          fullWidth
          value={keywords}
          onChange={(event) => setKeywords(event.target.value)}
          disabled={busy}
          placeholder="phone screen protector, tempered glass s23"
          helperText="What you would type into Amazon's search box. Separate several with commas."
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
          <TextField
            label="How many"
            size="small"
            type="number"
            value={targetCount}
            onChange={(event) => setTargetCount(event.target.value)}
            disabled={busy}
            inputProps={{ min: 1, max: 100 }}
            sx={{ maxWidth: 130 }}
            helperText="Max 100 per batch"
          />

          <Stack spacing={0.5} sx={{ flexGrow: 1, pt: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              Using your precheck filters
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                variant="outlined"
                label={priceMin === '' && priceMax === ''
                  ? 'Any price'
                  : `Price ${priceMin === '' ? 'any' : priceMin} - ${priceMax === '' ? 'any' : priceMax}`}
              />
              <Chip
                size="small"
                variant="outlined"
                label={minRating === '' ? 'Any rating' : `Rating ${minRating}+`}
              />
            </Stack>
            {priceMin === '' && priceMax === '' && (
              <Typography variant="caption" color="warning.main">
                No price range set. Set Price From / Price To in the filters above so the
                search does not spend credits on products you would discard.
              </Typography>
            )}
          </Stack>

          <Button
            variant="contained"
            onClick={() => startSourcing()}
            disabled={busy}
            startIcon={sourcing ? <CircularProgress size={16} /> : <SourceIcon />}
            sx={{
              bgcolor: BRAND_YELLOW,
              color: BRAND_DARK,
              fontWeight: 800,
              whiteSpace: 'nowrap',
              alignSelf: 'flex-start',
              '&:hover': { bgcolor: BRAND_YELLOW_DARK }
            }}
          >
            {sourcing ? 'Searching' : (autoRun ? 'Find & Run' : 'Find ASINs')}
          </Button>
        </Stack>

        <Collapse in={Boolean(progress)}>
          {progress && (
            <Stack spacing={0.75}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (progress.found / Math.max(1, progress.target)) * 100)}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant="caption" color="text.secondary">
                {progress.found}/{progress.target} found · {progress.pagesFetched} pages · {progress.creditsSpent} credits
              </Typography>
            </Stack>
          )}
        </Collapse>

        <Collapse in={Boolean(outcome)}>
          {outcome && (
            <Stack spacing={1}>
              <Alert
                severity={outcome.exhausted ? 'warning' : 'success'}
                sx={{ '& .MuiAlert-message': { width: '100%' } }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {outcome.exhausted
                      ? `Found ${outcome.found} of ${outcome.requested} — the keywords ran out`
                      : `Found ${outcome.found} ASINs`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {outcome.creditsSpent} credits this search · {outcome.totalServed} total from this run
                    {outcome.skipped?.liveOnEbay > 0 && ` · ${outcome.skipped.liveOnEbay} already active for this seller`}
                  </Typography>
                  {outcome.exhausted && (
                    <Typography variant="caption" color="text.secondary">
                      {STOP_REASON_HINTS[outcome.stopReason] || STOP_REASON_HINTS.keyword_dry}
                    </Typography>
                  )}
                  {outcome.stats && (
                    <Typography variant="caption" color="text.secondary">
                      Saw {outcome.stats.resultsSeen} results over {outcome.stats.pagesFetched} pages ·
                      {' '}{outcome.stats.rejectedPrice} outside price
                      {outcome.stats.rejectedSponsored > 0 && ` · ${outcome.stats.rejectedSponsored} sponsored`}
                      {outcome.stats.rejectedNoPrice > 0 && ` · ${outcome.stats.rejectedNoPrice} no price`}
                      {outcome.stats.rejectedRating > 0 && ` · ${outcome.stats.rejectedRating} below rating`}
                      {outcome.skipped?.liveOnEbay > 0 && ` · ${outcome.skipped.liveOnEbay} already active for this seller`}
                      {outcome.skipped?.alreadyListed > 0 && ` · ${outcome.skipped.alreadyListed} previously generated (kept)`}
                    </Typography>
                  )}
                </Stack>
              </Alert>

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip
                  title={outcome.atCeiling
                    ? 'This keyword has been paged to its depth limit, so there is nothing further to fetch. Change the keyword and search again.'
                    : 'Continues where the last search stopped. Never returns an ASIN this run has already shown you, including ones you discarded.'}
                >
                  <span>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<MoreIcon />}
                      onClick={() => startSourcing({ topUp: true })}
                      // Paged out: a top-up would return nothing at all, so the
                      // button is disabled rather than silently doing nothing.
                      disabled={busy || !runId || outcome.atCeiling}
                    >
                      Find {targetCount} more
                    </Button>
                  </span>
                </Tooltip>
                {outcome.atCeiling && (
                  <Typography variant="caption" color="text.secondary">
                    Keyword fully searched — try a different one.
                  </Typography>
                )}
                {outcome.errors?.length > 0 && (
                  <Typography variant="caption" color="warning.main">
                    {outcome.errors.length} search error{outcome.errors.length === 1 ? '' : 's'}
                  </Typography>
                )}
              </Stack>
            </Stack>
          )}
        </Collapse>
      </Stack>
    </Box>
  );
}
