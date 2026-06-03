export const agreementTemplates = {
  foodshare: {
    title: 'xShare Smart Contract',
    subtitle: 'FoodShare: Food Sharing Transaction',
    parties: {
      requester: 'Requester',
      provider: 'Provider',
      description:
        "This Agreement (hereinafter referred to as the 'Agreement') is entered into on {date}, by and between {requesterName}, with an address of {requesterAddress} (hereinafter referred to as the 'Requester'), and {providerName}, with an address of {providerAddress} (hereinafter referred to as the 'Provider') (collectively referred to as the 'Parties'). This Agreement is facilitated by an online application known as xShare.",
    },
    agreement:
      'The Parties agree that the Provider will deliver food/meal or arrange for the pick-up of food/meal for the Requester, and the Requester shall, at its own discretion, offer a gratuity in appreciation for the fulfillment of the contract.',
    requesterRepresentation:
      'The Requester must ensure that they will be available to confirm the receipt of the food/meal within the designated time, as set forth in this Agreement.',
    providerRepresentation:
      "The Provider represents that they will deliver the food/meal or arrange for the pick-up as per the requested need for the Requester within the time limit specified by the Requester. The Requester's option to offer the gratuity is contingent upon the Provider first meeting these provision requirements.",
    deliveryPlan:
      "The Delivery Plan is to be established as follows. The Provider agrees to deliver the food/meal or make it available for pick up by the Requester by {deliveryTime}. Unless an amendment regarding the date/time occurs, the delivery plan does not apply until any of the Provider's required date/time. If necessary, Requester is responsible for reheating the food/meal to their desired preference.",
    default:
      'In case the Provider fails to deliver the meal or make it available for pick up as per the Delivery Plan, the Provider will be given a bad rating. This rating will be made publicly available in the xShare app and visible to the user community, to discourage the community from entering further transactions with the Provider.',
    signatures: {
      requester: '{requesterName}',
      provider: '{providerName}',
    },
  },
  bloodshare: {
    title: 'BloodShare(TM) Smart Contract',
    subtitle:
      'BLOODSHARE(TM) SMART CONTRACT\nVersion 1.0\nEffective upon digital execution',
    parties: {
      requester: 'Recipient',
      provider: 'Donor',
      description:
        "This Smart Contract ('Agreement') is entered into by and between:\n- The Requesting Party (the 'Recipient'): {requesterName}\n- BOTCIERGE(TM) System Operator: MyBOTs LLC, a Georgia Limited Liability Company ('BOTCIERGE(TM)')\n- And any Participating Donors ('Donors') who enter into fulfillment of the Recipient's need",
    },
    agreement:
      "WHEREAS, the Recipient has submitted an urgent request for blood using the xShare platform, within the BloodShare(TM) application module;\n\nWHEREAS, the Recipient has voluntarily engaged the BOTCIERGE(TM) Helper Agent to fulfill this request through its network of verified Donors;\n\nNOW, THEREFORE, the following terms are set forth and agreed to upon the Recipient's digital consent and submission of the request:",
    bloodTypeCompatibility:
      "1. Blood Type Compatibility\nThe system will match the Recipient's blood type with eligible Donor blood types using the ABO and Rh compatibility standard as follows:\n\nIf Recipient is:     Eligible Donor Types:\nO-                   O-\nO+                   O-, O+\nA-                   A-, O-\nA+                   A-, A+, O-, O+\nB-                   B-, O-\nB+                   B-, B+, O-, O+\nAB-                  AB-, A-, B-, O-\nAB+                  All Blood Types\n\nRecipient has confirmed their blood type as: {bloodType}",
    donorMatchProtocol:
      '2. Donor Match Protocol\nBOTCIERGE(TM) will dispatch a real-time call to eligible Donors in proximity, along with location metadata and urgency markers. Donors are required to verify consent and health eligibility before dispatch.',
    voluntaryParticipation:
      '3. Voluntary Participation & Gratuity Option\nBoth the Donor and Recipient agree that participation in BloodShare(TM) is entirely voluntary and not compensated by BOTCIERGE(TM) or any affiliated entity. However:\n\na) The Recipient may, at their sole discretion, offer a gratuity (monetary or otherwise) through the xShare platform as a gesture of appreciation to the Donor.\n\nb) This gratuity is not required, solicited, nor enforced by BOTCIERGE(TM), and is considered a private, user-initiated transaction.\n\nc) Gratuities are processed through standard xShare peer-based protocols and do not imply a commercial transaction for the blood itself.',
    disclaimers:
      '4. Disclaimers & Liability Waiver\nThe Recipient understands and acknowledges that:\n\na) BOTCIERGE(TM), its owners, developers, affiliates, partners, and assigns are not medical providers.\n\nb) BOTCIERGE(TM) does not perform, supervise, or monitor the donation or transfusion process.\n\nc) BOTCIERGE(TM) makes no representation or warranty as to the safety, sterility, blood-borne disease screening, or suitability of any blood obtained via BloodShare(TM).\n\nd) This platform is a matching and communication facilitator only.\n\ne) The Recipient assumes all risk associated with accepting and using blood donated through this platform.\n\nTherefore, the Recipient agrees to indemnify, defend, and hold harmless BOTCIERGE(TM) and MyBOTs LLC from any and all claims, demands, damages, losses, liabilities, costs, or expenses arising out of or related to:\n- The request, offer, delivery, or use of blood arranged through this system\n- Any adverse reaction, injury, illness, or complication resulting from transfusion\n- Any civil, criminal, or regulatory liability stemming from noncompliance by the Donor, Recipient, or third-party facilitators',
    emergencyUse:
      '5. Emergency Use Clause\nThis smart contract is considered binding as an emergency consent instrument for the purpose of connecting humans in urgent need. It is not a substitute for formal hospital-based medical care. This contract shall be superseded by any hospital policies or jurisdictional health authority regulations at the time of transfusion.',
    consent:
      "6. Consent and Execution\nBy selecting 'I Accept and Proceed' below, the Recipient affirms:\n- That they are acting of their own free will\n- That they understand the risks and conditions of this agreement\n- That they agree to be bound by the terms of this smart contract\n\n[ ] I ACCEPT AND PROCEED\n\nSignature: Digitally Signed by {requesterName}\nDate: {date}",
    signatures: {
      requester: '{requesterName}',
      provider: '{providerName}',
    },
  },
  educationx: {
    title: 'EducationX Smart Contract',
    subtitle:
      'EDUCATIONX SMART CONTRACT\nVersion 1.0\nEffective upon digital execution',
    parties: {
      requester: 'Learner',
      provider: 'Educator',
      description:
        "This Smart Contract ('Agreement') is entered into by and between:\n- The Requesting Party (the 'Learner'): {requesterName}\n- BOTCIERGE(TM) System Operator: MyBOTs LLC, a Georgia Limited Liability Company ('BOTCIERGE(TM)')\n- And any Participating Educators ('Educators') who enter into fulfillment of the Learner's need",
    },
    purpose:
      '1. Purpose of Agreement\nThis smart contract enables the delivery of educational value from one party to another using the EducationX application within the BOTCIERGE(TM) ecosystem. The value in the exchange is defined during the intent post and accepted bid, and includes support in areas such as tutoring, study assistance, skill development, mentorship, academic editing, or other forms of educational enrichment.',
    valueExchange:
      '2. Nature of Value in the Exchange\nThe form of educational value may include, but is not limited to:\n- Live subject-specific tutoring (e.g., math, science, language arts)\n- Homework or assignment assistance\n- Test prep and standardized exam coaching (e.g., SAT, ACT, GRE)\n- Professional or technical skill training (e.g., coding, graphic design)\n- Essay and academic writing feedback\n- College or scholarship application support\n- Career mentorship and personal development\n\nOnce the value in the exchange is accepted, Camille will append a custom module to this contract outlining scope, format (text, audio, video), timeframe, deliverables, and expectations.',
    eligibility:
      '3. Eligibility & Verification\nAll Educators agree to BOTCIERGE identity verification, community code of conduct, and minimum qualifications where applicable. Learners agree to respectful engagement and proper use of the EducationX environment.',
    indemnity:
      '4. Indemnification Clause\nThe Learner agrees to hold EducationX, BOTCIERGE(TM), its creators, platform administrators, and Camille harmless from any disputes, inaccuracies, or dissatisfaction in outcome. EducationX does not guarantee academic success or results.',
    gratuity:
      '5. Optional Gratuity\nThe Learner may include a gratuity at their discretion. This is not required for service, and the Educator acknowledges this explicitly.',
    termination:
      '6. Cancellation & Fulfillment\nEither party may cancel before service delivery begins. Once the session is complete and both parties confirm fulfillment, this smart contract is considered closed.',
    supplemental:
      '7. Supplemental Agreement Clause\nIf the educational value being exchanged requires further clarification, specific legal terms, or session expansion beyond the scope of this base contract, a tailored Addendum may be generated by the EducationX application. This Addendum will include specific obligations, deliverables, disclosures, and/or safeguards depending on the nature of the value exchanged (e.g., multiple-session tutoring, exam prep guarantees, or access to confidential learner data). Both parties must accept the Addendum digitally for it to take effect. Once signed, the Addendum becomes part of this smart contract and equally enforceable.',
    consent:
      '8. Agreement Confirmation\nBy digitally signing, both Learner and Educator affirm that they have read, understood, and agreed to the above terms.\n\nSignature: Digitally Signed by {requesterName}\nDate: {date}',
    signatures: {
      requester: '{requesterName}',
      provider: '{providerName}',
    },
  },
  digither: {
    title: 'DigitHer Smart Contract',
    subtitle:
      'DIGITHER SMART CONTRACT\nVersion 1.0\nEffective upon digital execution',
    parties: {
      requester: 'Recipient',
      provider: 'Provider',
      description:
        "This Smart Contract ('Agreement') is entered into by and between:\n- The Requesting Party (the 'Recipient'): {requesterName}\n- BOTCIERGE(TM) System Operator: MyBOTs LLC, a Georgia Limited Liability Company ('BOTCIERGE(TM)')\n- And any Participating Providers ('Providers') who enter into fulfillment of the Recipient's need",
    },
    purpose:
      '1. Purpose of Agreement\nThis smart contract facilitates the delivery of assistance from one woman to another through DigitHer. The value in the exchange shall be selected at the time of post intent and finalized upon bid acceptance.',
    valueExchange:
      '2. Nature of Value in the Exchange\nThe form of value to be provided will be selected and confirmed during the post-intent phase and will be specific to the needs expressed by the Recipient and the bid accepted by the Provider. Options include, but are not limited to:\n- Crisis Escape Support\n- Mental Health Services\n- Reproductive & Maternal Health\n- Career Support & Digital Literacy\n- Period & Hygiene Resources\n- Emotional Sisterhood\n\nOnce the value in the exchange is finalized, a custom module describing the scope, delivery expectations, and risk acknowledgments will be appended to this agreement and digitally accepted by both parties.',
    eligibility:
      '3. Eligibility & Safety Measures\nBoth parties agree to abide by community guidelines. The Provider will undergo identity verification before fulfilling service delivery. If physical interaction is required, Camille will recommend a safe zone or dispatch a safety protocol if the user opts in.',
    indemnity:
      '4. Indemnification Clause\nBy accepting this agreement, the Recipient agrees to hold DigitHer, BOTCIERGE(TM), its owners, creators, and Camille harmless from any legal, medical, or personal liability incurred during or as a result of this transaction.',
    gratuity:
      '5. Optional Gratuity\nA voluntary gratuity can be included by the Recipient. The Provider acknowledges it is optional and not a condition for service.',
    termination:
      '6. Termination Clause\nEither party may cancel the agreement prior to delivery. Once service is fulfilled and confirmed, this smart contract shall be closed.',
    consent:
      '7. Agreement Confirmation\nBy digitally signing, both Recipient and Provider acknowledge that they have read, understood, and agreed to the above terms.\n\nSignature: Digitally Signed by {requesterName}\nDate: {date}',
    signatures: {
      requester: '{requesterName}',
      provider: '{providerName}',
    },
  },
};

// Common sections that are the same for all agreement types
export const commonSections = {
  indemnity:
    'Both Parties agree to indemnify and hold harmless the company that sells the xShare app, its owners, its employees, and officials from any legal responsibility or liability for any losses, misfortunes, or undesirable outcomes arising from this transaction. Both Parties enter into this online transactional agreement of their own free will and do so at their own risks.',
  governingLaw:
    'This Agreement shall be governed by and construed in accordance with the laws of Gujarat, India.',
  severability:
    'Every provision of this Agreement is determined to be invalid or unenforceable in any respect, such determination will not affect such provision in any other respect or any other provision of this Agreement, which will remain in full force and effect.',
  entireAgreement:
    'This Agreement represents the entire agreement between the Parties. This Agreement supersedes any previous agreement, whether written or oral, relating to the subject matter hereof.',
  amendments:
    'Any amendment to this Agreement must be documented within the xShare app and confirmed by both Parties within the application.',
  notices:
    "All official communication pertaining to this Agreement will be conducted by the xShare app's parent company as necessary, primarily to email or tour message. The transactional events required for the fulfilment of this Agreement, including the receipt confirmation and period timing of each event, are carefully monitored, tracked, and recorded in detailed system transaction logs by xShare.",
};
