package com.cigna.rally;

import java.util.ArrayList;
import java.util.Date;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.Option;

import com.cigna.rally.data.Project;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.rallydev.rest.request.QueryRequest;
import com.rallydev.rest.request.UpdateRequest;
import com.rallydev.rest.response.QueryResponse;
import com.rallydev.rest.response.UpdateResponse;
import com.rallydev.rest.util.Fetch;
import com.rallydev.rest.util.QueryFilter;

public class FixStoryPermissions extends RallyTask
{
	private String		sourceProjectName;
	protected String	sourceWorkspace		= "";
	protected String	sourceWorkspaceId	= "";
	protected String	destWorkspaceId		= "";
	protected String	destWorkspace		= "";
	protected Boolean	includeChildren		= false;

	@Override
	public void performTask() throws Exception
	{
		sourceWorkspaceId = getWorkspaceReference(sourceWorkspace);
		destWorkspaceId = getWorkspaceReference(destWorkspace);

		Project sourceProject = getProjectReference(sourceWorkspaceId, sourceProjectName);
		Project destProject = getProjectReference(destWorkspaceId, sourceProjectName);

		processType("heirarchicalrequirement", sourceProject, destProject);
		processType("defect", sourceProject, destProject);
	}

	private void processType(String type, Project sourceProject, Project destProject) throws Exception
	{
		QueryRequest request = new QueryRequest(type);
		request.setFetch(new Fetch("FormattedID"));
		request.setLimit(999999);
		request.setWorkspace(sourceWorkspaceId);
		request.setProject(sourceProject.get_ref());
		request.setScopedDown(includeChildren);
		request.setQueryFilter(new QueryFilter("ScheduleState", "=", "Accepted"));
		QueryResponse response = restApi.query(request);
		printErrorsAndWarnings(response);

		ArrayList<String> acceptedStories = new ArrayList<String>();

		log.info("Found " + response.getTotalResultCount() + " accepted " + type);
		JsonArray results = response.getResults();
		for (int i = 0; i < results.size(); i++)
		{
			acceptedStories.add(results.get(i).getAsJsonObject().get("FormattedID").getAsString());
		}

		request = new QueryRequest(type);
		request.setFetch(new Fetch("FormattedID", "OldFormattedID", "ScheduleState"));
		request.setLimit(999999);
		request.setWorkspace(destWorkspaceId);
		request.setProject(destProject.get_ref());
		request.setScopedDown(includeChildren);
		if (!type.equals("defect"))
			request.setQueryFilter(new QueryFilter("DirectChildrenCount", "=", "0"));
		response = restApi.query(request);
		printErrorsAndWarnings(response);

		results = response.getResults();

		JsonObject updateStory = new JsonObject();
		updateStory.addProperty("ScheduleState", "Accepted");

		for (int i = 0; i < results.size(); i++)
		{
			JsonObject storyObject = results.get(i).getAsJsonObject();
			String oldFormattedId = storyObject.get("c_OldFormattedID").getAsString();
			String formattedId = storyObject.get("FormattedID").getAsString();
			if (acceptedStories.contains(oldFormattedId))
			{
				String storyRef = storyObject.get("_ref").getAsString();
				String scheduleState = storyObject.get("ScheduleState").getAsString();
				if (!scheduleState.equals("Accepted"))
				{
					log.info(formattedId + " ScheduleState changed from Accepted to " + scheduleState + ", changing back to accepted");
					UpdateRequest updateStoryRequest = new UpdateRequest(storyRef, updateStory);
					UpdateResponse updateStoryResponse = restApi.update(updateStoryRequest);
					printErrorsAndWarnings(updateStoryResponse);
				}
			}
		}
	}

	public static void main(String[] args)
	{
		FixStoryPermissions task = new FixStoryPermissions();
		try
		{
			task.addCommandLineOptions();
			CommandLine commands = task.parseCommandLine(args, task.getClass().getSimpleName());
			if (commands.hasOption("dw"))
			{
				task.destWorkspace = commands.getOptionValue("dw");
			}
			if (commands.hasOption("sw"))
			{
				task.sourceWorkspace = commands.getOptionValue("sw");
			}
			if (commands.hasOption("sp"))
			{
				task.sourceProjectName = commands.getOptionValue("sp");
			}

			if (commands.hasOption("children"))
				task.includeChildren = true;

			task.connectToRally();
			task.performTask();
			Date end = new Date();
			Long elapsed = (end.getTime() - task.start.getTime()) / 1000;
			task.log.info("Completed task, Total time: " + elapsed + " seconds");
		}
		catch (Throwable e)
		{
			task.log.error(e);
		}
		finally
		{
			try
			{
				if (task.restApi != null)
					task.restApi.close();
			}
			catch (Throwable e)
			{
				task.log.error(e);
			}
		}
	}

	@Override
	public void addTaskCommandLineOptions()
	{
		Option sp = new Option("sp", "sourceProject", true, "Source Project to check for Accepted work items");
		sp.setRequired(true);
		commandLineOptions.addOption(sp);

		Option sw = new Option("sw", "sourceWorkspace", true, "Source workspace name to copy from");
		sw.setRequired(true);
		commandLineOptions.addOption(sw);

		Option dw = new Option("dw", "destWorkspace", true, "Destination workspace name to copy to");
		dw.setRequired(true);
		commandLineOptions.addOption(dw);

		commandLineOptions.addOption("children", false, "Include child projects in the analysis");
	}
}
