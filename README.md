# ecqm-attribute-analyzer

A utility for parsing measure logic and identifying any discrepancies between a FHIR Implementation Guide's (IG) "Must Support" attributes, and the attributes accessed by the logic of an Electronic Clinical Quality Measure (eCQM)

## Background

The [QI-Core Implementation Guide](https://build.fhir.org/ig/HL7/fhir-qi-core/) defines some profiles to represent data for quality-focused applications such as the development of eCQMs. For certain FHIR resources, these profiles indicate which attributes on those resources are identified as "Must Support," meaning that implementations that consume or produce this data must have support for these attributes.

In eCQM logic, these attributes may be accessed within CQL queries to determine population criteria for patients when calculating the measure. As such, we expect those attributes accessed by measure logic to be marked as "Must Support" attributes in the QI-Core implementation guide.

This tool will parse available FHIR measure logic and identify any attributes accessed by the measure that are not marked as must support in QI-Core.

In addition, this tool will identify any "new" attributes that are "Must Support" in QI-Core. That is, attributes that were not marked as "Must Support" in US-Core, but have been upgraded to "Must Support" by QI-Core

## Usage

### Quickstart

**Note**: The setup for this script relies on the `curl` and `unzip` commands, which are available by default on unix-based operating systems. For Windows, follow the [manual setup instructions](#manual-setup) below

Install dependencies and run setup script to get measures and profiles:
``` bash
npm install
./setup.sh
```

Run the app to parse measure logic and get output:
``` bash
npm start
```

The script will report any discrepancies found to the console, along with any errors encountered when trying to parse the measure logic. A file `output.xlsx` will also be generated which is a styled spreadsheet for each measure that indicates if the properties accessed for each profile are marked as "Must Support" or not

### Manual Setup

The `setup.sh` script will only work on MacOS or Linux. To replicate the steps taken by the setup script:

1) Clone the connectathon repo into the root of the project:

``` bash
git clone https://github.com/dbcg/connectathon
```

2) Download the [JSON structure definitions](https://build.fhir.org/ig/HL7/fhir-qi-core/downloads.html#definitions) from the QI-Core Implementation Guide, and unzip the contents to a directory called `qicore-ig` at the root of the project

3) Download the [Full US-Core IG](https://www.hl7.org/fhir/us/core/downloads.html#downloadable-copy-of-entire-specification) and unzip the contents to a directory called `uscore-ig` at the root of the project

4) Run the structure definition parsing script to generate `src/qicore-must-supports.json` and `src/uscore-must-supports.json`:

``` bash
npm run parse
```

Now, the project should be set up the same as it would have been via a run of the `setup.sh` script. Run `npm start` to generate the output as shown above.

## Inspecting the Output

* Open `output.xlsx` in Microsoft Excel. There will be a worksheet present at the bottom for each successfully parsed measure
* Each worksheet contains the FHIR resource types queried for by the measure logic, as well as any attributes accessed by the filters in those queries
* Cells are colored green if the corresponding attribute is marked as "Must Support" in the QI-Core IG
* Cells are colored red if the corresponding attribute is NOT marked as "Must Support" in the Qi-Core IG
* Cells are colored yellow if the corresponding attribute is marked as "Must Support" in the QI-Core IG but not "Must Support" in the US-Core IG (for applicable profiles)
