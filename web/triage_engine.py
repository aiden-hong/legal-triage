"""
Legal Triage Engine - Python port for Streamlit
Core classification logic (conservative approach)
"""

import hashlib
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
from pathlib import Path
import yaml


@dataclass
class DetectedRedFlag:
    code: str
    reason: str
    matched_keywords: List[str]
    severity: str  # 'critical' | 'high' | 'medium' | 'low'


@dataclass
class TriageInput:
    description: str
    exposure: Optional[str] = None  # 'public' | 'members_only' | 'specific_group' | 'internal_test'
    data_usage: Optional[str] = None  # 'collects' | 'no_collection' | 'unclear'
    revenue_model: Optional[str] = None  # 'free' | 'paid_once' | 'subscription' | 'ads' | 'commission'
    external_communication: Optional[str] = None  # 'customer_facing' | 'media' | 'internal'
    cross_border: Optional[str] = None  # 'domestic_only' | 'includes_overseas' | 'unclear'


@dataclass
class TriageOutput:
    routing: str  # 'TYPE_1' | 'TYPE_2'
    confidence: float
    red_flags: List[DetectedRedFlag]
    missing_info_questions: List[str]
    safe_guardrails: List[str]
    recommended_next_step: str  # 'LEGAL_REVIEW' | 'PROCEED_WITH_GUARDRAILS'
    timestamp: str
    input_hash: str = ""


class TriageEngine:
    """Triage Engine - Conservative classification"""

    def __init__(self, rubric_path: Optional[str] = None):
        if rubric_path is None:
            rubric_path = str(Path(__file__).parent.parent / "rubric.yaml")
        self.rubric = self._load_rubric(rubric_path)

    def _load_rubric(self, rubric_path: str) -> Dict[str, Any]:
        """Load rubric.yaml configuration"""
        with open(rubric_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)

    def triage(self, input_data: TriageInput) -> TriageOutput:
        """Main triage function"""
        timestamp = datetime.now().isoformat()
        input_hash = self._hash_input(input_data.description)

        # Step 1: Red flag detection
        detected_flags = self._detect_red_flags(input_data.description)

        # Step 2: Generate missing info questions
        missing_questions = self._generate_missing_info_questions(input_data)

        # Step 3: Determine guardrails
        guardrails = self._determine_guardrails(input_data, detected_flags)

        # Step 4: Calculate routing (conservative approach)
        routing, confidence = self._calculate_routing(
            detected_flags, missing_questions, input_data
        )

        # Step 5: Determine next step
        next_step = self._determine_next_step(routing, confidence)

        return TriageOutput(
            routing=routing,
            confidence=confidence,
            red_flags=detected_flags,
            missing_info_questions=missing_questions,
            safe_guardrails=guardrails,
            recommended_next_step=next_step,
            timestamp=timestamp,
            input_hash=input_hash,
        )

    def _detect_red_flags(self, description: str) -> List[DetectedRedFlag]:
        """Detect red flags via keyword matching"""
        normalized_desc = description.lower()
        detected = []

        for flag in self.rubric.get('red_flags', []):
            matched_keywords = []

            for keyword in flag.get('keywords', []):
                if keyword.lower() in normalized_desc:
                    matched_keywords.append(keyword)

            if matched_keywords:
                detected.append(DetectedRedFlag(
                    code=flag['code'],
                    reason=flag['reason'],
                    matched_keywords=matched_keywords,
                    severity=flag['severity'],
                ))

        return detected

    def _generate_missing_info_questions(self, input_data: TriageInput) -> List[str]:
        """Generate questions for missing information"""
        questions = []
        normalized_desc = input_data.description.lower()

        for template in self.rubric.get('question_templates', []):
            should_ask = False

            # trigger_if_unknown: ask if field not provided
            if template.get('trigger_if_unknown'):
                should_ask = self._is_category_missing(template['category'], input_data)

            # trigger_if_contains: ask if description contains keywords
            if template.get('trigger_if_contains'):
                for keyword in template['trigger_if_contains']:
                    if keyword.lower() in normalized_desc:
                        should_ask = True
                        break

            if should_ask:
                questions.append(template['question'])

        return questions

    def _is_category_missing(self, category: str, input_data: TriageInput) -> bool:
        """Check if category field is missing"""
        category_mapping = {
            'exposure': 'exposure',
            'data_usage': 'data_usage',
            'revenue_model': 'revenue_model',
            'external_communication': 'external_communication',
            'cross_border': 'cross_border',
        }

        field_name = category_mapping.get(category)
        if not field_name:
            return False

        return getattr(input_data, field_name, None) is None

    def _determine_guardrails(
        self, input_data: TriageInput, detected_flags: List[DetectedRedFlag]
    ) -> List[str]:
        """Determine applicable guardrails"""
        guardrails = []
        normalized_desc = input_data.description.lower()
        flag_codes = [f.code for f in detected_flags]

        for guardrail in self.rubric.get('safe_guardrails', []):
            should_include = False
            condition = guardrail.get('condition', '')

            # Condition-based guardrail matching
            if condition == 'data_collection':
                should_include = (
                    input_data.data_usage in ('collects', 'unclear') or
                    'PII_COLLECTION' in flag_codes
                )

            elif condition == 'marketing':
                should_include = (
                    '마케팅' in normalized_desc or
                    '광고' in normalized_desc or
                    'marketing' in normalized_desc or
                    'EXAGGERATED_AD' in flag_codes or
                    'CELEBRITY_MEDICAL_ENDORSEMENT' in flag_codes
                )

            elif condition == 'user_content':
                should_include = (
                    'ugc' in normalized_desc or
                    '사용자 생성' in normalized_desc or
                    '댓글' in normalized_desc or
                    '리뷰' in normalized_desc or
                    'USER_CONTENT_LIABILITY' in flag_codes
                )

            elif condition == 'terms_update':
                should_include = (
                    '약관' in normalized_desc or
                    '정책 변경' in normalized_desc or
                    'terms' in normalized_desc
                )

            elif condition == 'refund':
                should_include = (
                    input_data.revenue_model in ('paid_once', 'subscription') or
                    'PAYMENT_HANDLING' in flag_codes
                )

            # Medical ad specific guardrails
            elif condition in ('medical_ad_general', 'individual_variance',
                             'side_effect_disclosure', 'medical_consultation_required'):
                should_include = any(
                    code in flag_codes for code in [
                        'PROCEDURE_MENTION', 'MEDICAL_CLAIM', 'EFFECT_GUARANTEE',
                        'NO_SIDE_EFFECT_DISCLOSURE', 'EXAGGERATED_MEDICAL_CLAIM'
                    ]
                )

            elif condition == 'before_after_restriction':
                should_include = 'BEFORE_AFTER_PHOTO' in flag_codes

            elif condition == 'review_restriction':
                should_include = 'PATIENT_TESTIMONIAL' in flag_codes

            elif condition == 'price_event_restriction':
                should_include = 'PRICE_DISCOUNT_EVENT' in flag_codes

            elif condition == 'gift_restriction':
                should_include = 'GIFT_INCENTIVE' in flag_codes

            elif condition == 'superlative_removal':
                should_include = 'COMPARATIVE_SUPERIORITY' in flag_codes

            elif condition == 'guarantee_removal':
                should_include = 'EFFECT_GUARANTEE' in flag_codes

            elif condition == 'endorsement_disclosure':
                should_include = 'CELEBRITY_MEDICAL_ENDORSEMENT' in flag_codes

            elif condition == 'ugc_monitoring':
                should_include = 'USER_CONTENT_LIABILITY' in flag_codes

            elif condition == 'review_incentive_prohibition':
                should_include = 'REVIEW_MANIPULATION' in flag_codes

            if should_include:
                guardrails.append(guardrail['text'])

        return guardrails

    def _calculate_routing(
        self,
        detected_flags: List[DetectedRedFlag],
        missing_questions: List[str],
        input_data: TriageInput
    ) -> tuple:
        """Calculate final routing and confidence (conservative approach)"""
        policy = self.rubric.get('routing_policy', {})
        default_routing = policy.get('default', 'TYPE_1')
        confidence_threshold = policy.get('confidence_threshold', 0.7)
        missing_info_action = policy.get('missing_info_action', 'TYPE_1')

        # Critical severity -> always TYPE_1
        has_critical = any(f.severity == 'critical' for f in detected_flags)
        if has_critical:
            return ('TYPE_1', 0.95)

        # High severity -> TYPE_1 (high confidence)
        has_high = any(f.severity == 'high' for f in detected_flags)
        if has_high:
            return ('TYPE_1', 0.85)

        # Medium severity only
        has_medium = any(f.severity == 'medium' for f in detected_flags)

        # Too many missing info -> TYPE_1
        if len(missing_questions) >= 2:
            return (missing_info_action, 0.6)

        # External communication -> TYPE_1
        if input_data.external_communication in ('media', 'customer_facing'):
            if has_medium:
                return ('TYPE_1', 0.75)

        # Medium flag only, enough info
        if has_medium and len(missing_questions) < 2:
            confidence = 0.65
            if confidence < confidence_threshold:
                return ('TYPE_1', confidence)
            return ('TYPE_2', confidence)

        # No red flags, enough info -> TYPE_2
        if len(detected_flags) == 0 and len(missing_questions) == 0:
            return ('TYPE_2', 0.9)

        # No red flags but missing info
        if len(detected_flags) == 0 and len(missing_questions) > 0:
            confidence = 1 - len(missing_questions) * 0.15
            if confidence < confidence_threshold:
                return ('TYPE_1', confidence)
            return ('TYPE_2', confidence)

        # Default: conservative TYPE_1
        return (default_routing, 0.5)

    def _determine_next_step(self, routing: str, confidence: float) -> str:
        """Determine recommended next step"""
        if routing == 'TYPE_1':
            return 'LEGAL_REVIEW'

        # TYPE_2 but low confidence -> recommend legal review
        if confidence < 0.8:
            return 'LEGAL_REVIEW'

        return 'PROCEED_WITH_GUARDRAILS'

    def _hash_input(self, description: str) -> str:
        """Hash input for privacy"""
        return hashlib.sha256(description.encode()).hexdigest()[:16]

    def get_rubric(self) -> Dict[str, Any]:
        """Get rubric (for testing)"""
        return self.rubric
