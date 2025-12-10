class ScalesTeacher():

    def __init__(self, llm):

        ## getting the llm reference
        self.llm = llm

        ## starting notes array
        self.notes_array = []

        ## This is the way the teacher works
        self.prompt = [
            (
                "system",
                """
                You are a music theory assistant.
                When asked about scales, respond with ONLY the note names separated by commas in the summary field.
                Do not include any descriptions, explanations, or additional text.
                
                For example:
                - For C major scale, summary should be: "C, D, E, F, G, A, B"
                - For G major scale, summary should be: "G, A, B, C, D, E, F#"
                
                The summary field must contain ONLY the comma-separated note names, nothing else.
                
                Wrap the output in the exact format specified here: {format_instructions}
                """
            ),
            ("human", "{query}"),
        ]
    
    ## This will get the basic template of how the teacher works
    def getPrompt(self):
        return self.prompt
    
    # Getting notes from a tune
    def getNotesFromTune(self, tune: str = None) -> list[str]:
        try:

            ## Basic validation
            if tune is None:
                raise ValueError("Please provide a tune")
            
            ## TODO: Later add the major, minor, modal scales, etc.
            query = "What is the " + tune + " major scale? "

            # This will return a BasicAIResponse object directly
            structured_response = self.llm.chain.invoke({"query": query})

            ## Extracting the summary which contains the notes
            summary = structured_response.summary

            # Check if summary contains valid notes
            if not summary or summary.strip() == "":
                raise ValueError(f"Empty response received getNotesFromTune")
            
            ## Splitting the notes into an array
            self.notes_array = [n.strip() for n in summary.split(",")]

            return self.notes_array

        except ValueError as ve:
            print(f"ValueError: {ve}")
            return []
        except Exception as e:
            print(f"Unexpected error while getting notes for {tune}: {e}")
            return []