from lava_backend.transcribe_core import (
    Pause,
    Word,
    confidence_from_logprob,
    detect_pauses,
)


def words(*entries):
    return [
        Word(
            word=entry[0],
            start=entry[1],
            end=entry[2],
            confidence=entry[3] if len(entry) > 3 else 1.0,
        )
        for entry in entries
    ]


class TestDetectPauses:
    def test_long_gap_becomes_a_pause(self):
        ws = words(
            ("ali", 0.0, 0.4),
            ("jungle", 1.2, 1.8),
        )
        assert detect_pauses(ws) == [Pause(start=0.4, end=1.2, gap=0.8)]

    def test_short_gap_is_not_a_pause(self):
        ws = words(
            ("men", 0.0, 0.3),
            ("gaya", 0.35, 0.7),
        )
        assert detect_pauses(ws) == []

    def test_gap_exactly_at_threshold_is_a_pause(self):
        ws = words(
            ("a", 0.0, 0.2),
            ("b", 0.5, 0.7),
        )
        assert detect_pauses(ws) == [Pause(start=0.2, end=0.5, gap=0.3)]

    def test_empty_words_produce_no_pauses(self):
        assert detect_pauses([]) == []

    def test_single_word_produces_no_pauses(self):
        assert detect_pauses(words(("only", 0.0, 1.0))) == []

    def test_gaps_across_multiple_pairs(self):
        ws = words(
            ("a", 0.0, 0.3),
            ("b", 0.4, 0.7),
            ("c", 2.0, 2.4),
        )
        assert detect_pauses(ws) == [Pause(start=0.7, end=2.0, gap=1.3)]

    def test_zero_gap_words_produce_no_pause(self):
        ws = words(
            ("hello", 0.0, 0.5),
            ("world", 0.5, 1.0),
        )
        assert detect_pauses(ws) == []

    def test_unsorted_words_are_sorted_by_start(self):
        ws = words(
            ("later", 2.0, 2.3),
            ("earlier", 0.0, 0.4),
        )
        assert detect_pauses(ws) == [Pause(start=0.4, end=2.0, gap=1.6)]


class TestConfidenceFromLogprob:
    def test_zero_logprob_is_full_confidence(self):
        assert confidence_from_logprob(0.0) == 1.0

    def test_mid_logprob_scales(self):
        assert confidence_from_logprob(-1.5) == 0.5

    def test_low_logprob_clamps_at_zero(self):
        assert confidence_from_logprob(-4.0) == 0.0

    def test_positive_logprob_clamps_at_one(self):
        assert confidence_from_logprob(0.5) == 1.0