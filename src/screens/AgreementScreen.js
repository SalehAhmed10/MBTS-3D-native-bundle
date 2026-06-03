import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {agreementTemplates, commonSections} from '../utils/agreementTemplates';

const AgreementScreen = ({route}) => {
  const {
    packageName,
    requesterName,
    providerName,
    requesterAddress,
    providerAddress,
    dateOfContract,
    deliveryTime,
    bloodType,
  } = route.params;


  // Get the template based on package name
  const template =
    agreementTemplates[packageName.toLowerCase()] ||
    agreementTemplates.foodshare;

  // Format the date
  const currentDate = new Date()?.toISOString().split('T')[0];
  const updatedAtFormatted = new Date(dateOfContract)
    ?.toISOString()
    .split('T')[0];

  const deliveryTimeFormatted = new Date(deliveryTime)
    ?.toISOString()
    .split('T')[0];

  // Replace placeholders in the template with styled text components
  const formatText = (text = '') => {
    if (!text) return null;

    const parts = text.split(
      /({date}|{requesterName}|{providerName}|{requesterAddress}|{providerAddress}|{deliveryTime}|{bloodType})/g,
    );

    return parts.map((part, index) => {
      if (part === '{date}') {
        return (
          <Text key={index} style={styles.orangeBoldText}>
            {updatedAtFormatted}
          </Text>
        );
      } else if (
        part === '{requesterName}' ||
        part === '{providerName}' ||
        part === '{requesterAddress}' ||
        part === '{providerAddress}' ||
        part === '{deliveryTime}' ||
        part === '{bloodType}'
      ) {
        const value =
          part === '{requesterName}'
            ? requesterName
            : part === '{providerName}'
            ? providerName
            : part === '{requesterAddress}'
            ? requesterAddress
            : part === '{providerAddress}'
            ? providerAddress
            : part === '{deliveryTime}'
            ? deliveryTimeFormatted
            : bloodType || 'Not Specified';

        return (
          <Text key={index} style={styles.orangeBoldText}>
            {value}
          </Text>
        );
      } else if (part) {
        return (
          <Text key={index} style={styles.text}>
            {part}
          </Text>
        );
      }
      return null;
    });
  };

  const renderBloodShareSections = () => {
    if (packageName.toLowerCase() !== 'bloodshare') return null;

    return (
      <>
        {template.bloodTypeCompatibility && (
          <Section title="BLOOD TYPE COMPATIBILITY">
            <Text style={styles.text}>
              {formatText(template.bloodTypeCompatibility)}
            </Text>
          </Section>
        )}

        {template.donorMatchProtocol && (
          <Section title="DONOR MATCH PROTOCOL">
            <Text style={styles.text}>
              {formatText(template.donorMatchProtocol)}
            </Text>
          </Section>
        )}

        {template.voluntaryParticipation && (
          <Section title="VOLUNTARY PARTICIPATION & GRATUITY OPTION">
            <Text style={styles.text}>
              {formatText(template.voluntaryParticipation)}
            </Text>
          </Section>
        )}

        {template.disclaimers && (
          <Section title="DISCLAIMERS & LIABILITY WAIVER">
            <Text style={styles.text}>{formatText(template.disclaimers)}</Text>
          </Section>
        )}

        {template.emergencyUse && (
          <Section title="EMERGENCY USE CLAUSE">
            <Text style={styles.text}>{formatText(template.emergencyUse)}</Text>
          </Section>
        )}

        {template.consent && (
          <Section title="CONSENT AND EXECUTION">
            <Text style={styles.text}>{formatText(template.consent)}</Text>
          </Section>
        )}
      </>
    );
  };

  const renderDigitHerSections = () => {
    if (packageName.toLowerCase() !== 'digither') return null;

    return (
      <>
        {template.purpose && (
          <Section title="PURPOSE OF AGREEMENT">
            <Text style={styles.text}>{formatText(template.purpose)}</Text>
          </Section>
        )}

        {template.valueExchange && (
          <Section title="NATURE OF VALUE IN THE EXCHANGE">
            <Text style={styles.text}>
              {formatText(template.valueExchange)}
            </Text>
          </Section>
        )}

        {template.eligibility && (
          <Section title="ELIGIBILITY & SAFETY MEASURES">
            <Text style={styles.text}>{formatText(template.eligibility)}</Text>
          </Section>
        )}

        {template.indemnity && (
          <Section title="INDEMNIFICATION CLAUSE">
            <Text style={styles.text}>{formatText(template.indemnity)}</Text>
          </Section>
        )}

        {template.gratuity && (
          <Section title="OPTIONAL GRATUITY">
            <Text style={styles.text}>{formatText(template.gratuity)}</Text>
          </Section>
        )}

        {template.termination && (
          <Section title="TERMINATION CLAUSE">
            <Text style={styles.text}>{formatText(template.termination)}</Text>
          </Section>
        )}

        {template.consent && (
          <Section title="AGREEMENT CONFIRMATION">
            <Text style={styles.text}>{formatText(template.consent)}</Text>
          </Section>
        )}
      </>
    );
  };

  const renderEducationXSections = () => {
    if (packageName.toLowerCase() !== 'educationx') return null;

    return (
      <>
        {template.purpose && (
          <Section title="PURPOSE OF AGREEMENT">
            <Text style={styles.text}>{formatText(template.purpose)}</Text>
          </Section>
        )}

        {template.valueExchange && (
          <Section title="NATURE OF VALUE IN THE EXCHANGE">
            <Text style={styles.text}>
              {formatText(template.valueExchange)}
            </Text>
          </Section>
        )}

        {template.eligibility && (
          <Section title="ELIGIBILITY & VERIFICATION">
            <Text style={styles.text}>{formatText(template.eligibility)}</Text>
          </Section>
        )}

        {template.indemnity && (
          <Section title="INDEMNIFICATION CLAUSE">
            <Text style={styles.text}>{formatText(template.indemnity)}</Text>
          </Section>
        )}

        {template.gratuity && (
          <Section title="OPTIONAL GRATUITY">
            <Text style={styles.text}>{formatText(template.gratuity)}</Text>
          </Section>
        )}

        {template.termination && (
          <Section title="CANCELLATION & FULFILLMENT">
            <Text style={styles.text}>{formatText(template.termination)}</Text>
          </Section>
        )}

        {template.supplemental && (
          <Section title="SUPPLEMENTAL AGREEMENT CLAUSE">
            <Text style={styles.text}>{formatText(template.supplemental)}</Text>
          </Section>
        )}

        {template.consent && (
          <Section title="AGREEMENT CONFIRMATION">
            <Text style={styles.text}>{formatText(template.consent)}</Text>
          </Section>
        )}
      </>
    );
  };

  const renderStandardSections = () => {
    if (packageName.toLowerCase() === 'bloodshare') return null;

    return (
      <>
        {template.agreement && (
          <Section title="AGREEMENT">
            <Text style={styles.text}>{formatText(template.agreement)}</Text>
          </Section>
        )}

        {template.requesterRepresentation && (
          <Section
            title={`${template.parties.requester.toUpperCase()} REPRESENTATION`}>
            <Text style={styles.text}>
              {formatText(template.requesterRepresentation)}
            </Text>
          </Section>
        )}

        {template.providerRepresentation && (
          <Section
            title={`${template.parties.provider.toUpperCase()} REPRESENTATION`}>
            <Text style={styles.text}>
              {formatText(template.providerRepresentation)}
            </Text>
          </Section>
        )}

        {template.deliveryPlan && (
          <Section title="DELIVERY PLAN">
            <Text style={styles.text}>{formatText(template.deliveryPlan)}</Text>
          </Section>
        )}

        {template.default && (
          <Section title="DEFAULT">
            <Text style={styles.text}>{formatText(template.default)}</Text>
          </Section>
        )}

        {commonSections.indemnity && (
          <Section title="INDEMNITY">
            <Text style={styles.text}>{commonSections.indemnity}</Text>
          </Section>
        )}

        {commonSections.governingLaw && (
          <Section title="GOVERNING LAW">
            <Text style={styles.text}>{commonSections.governingLaw}</Text>
          </Section>
        )}

        {commonSections.severability && (
          <Section title="SEVERABILITY">
            <Text style={styles.text}>{commonSections.severability}</Text>
          </Section>
        )}

        {commonSections.entireAgreement && (
          <Section title="ENTIRE AGREEMENT">
            <Text style={styles.text}>{commonSections.entireAgreement}</Text>
          </Section>
        )}

        {commonSections.amendments && (
          <Section title="AMENDMENTS">
            <Text style={styles.text}>{commonSections.amendments}</Text>
          </Section>
        )}

        {commonSections.notices && (
          <Section title="NOTICES">
            <Text style={styles.text}>{commonSections.notices}</Text>
          </Section>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Main Header */}
        <Text style={styles.mainHeader}>{template.title}</Text>
        <Text style={styles.subHeader}>{template.subtitle}</Text>

        {/* Parties Section */}
        {template.parties?.description && (
          <Section title="PARTIES">
            <Text style={styles.text}>
              {formatText(template.parties.description)}
            </Text>
          </Section>
        )}

        {renderBloodShareSections()}
        {renderDigitHerSections()}
        {renderEducationXSections()}
        {renderStandardSections()}

        {/* Signatures */}
        <Section title="SIGNATURES">
          <Text style={styles.text}>
            By signing below, the Parties confirm that they have read and agree
            to the terms of this Agreement.
          </Text>
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureLabel}>
              {template.parties.requester}:
            </Text>
            <Text style={styles.signatureName}>{requesterName}</Text>
          </View>
          <View style={styles.signatureContainer}>
            <Text style={styles.signatureLabel}>
              {template.parties.provider}:
            </Text>
            <Text style={styles.signatureName}>{providerName}</Text>
          </View>
        </Section>
      </ScrollView>
    </View>
  );
};

const Section = ({title, children}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 15,
    paddingBottom: 30,
  },
  mainHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    color: '#04aec5',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    color: '#04aec5',
    textAlign: 'center',
  },
  section: {
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#04aec5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#34495e',
  },
  orangeBoldText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fe971f',
  },
  orangeText: {
    fontSize: 14,
    color: '#fe971f',
  },
  signatureContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  signatureLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  signatureName: {
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
    color: '#fe971f',
  },
});

export default AgreementScreen;
